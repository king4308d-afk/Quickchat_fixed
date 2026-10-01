import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
  UID
} from 'agora-rtc-sdk-ng';

// Configure log level: 4 = NONE (suppresses Agora internal rollback console.error outputs)
AgoraRTC.setLogLevel(4);

export interface AgoraSessionConfig {
  appId?: string;
  channel: string;
  token?: string | null;
  uid?: UID;
  containerId: string; // Target div id for remote video: "remote-video"
  localStream?: MediaStream | null;
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  onRemoteTrackReady?: (mediaType: 'video' | 'audio', user: IAgoraRTCRemoteUser) => void;
  onRemoteTrackUnpublished?: (mediaType: 'video' | 'audio', user: IAgoraRTCRemoteUser) => void;
  onFallback?: (reason: string) => void;
  onError?: (err: any) => void;
}

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private localVideoTrack: ILocalVideoTrack | null = null;
  private isJoined = false;
  private isFallbackMode = false;
  private fallbackNotice: string | null = null;
  private currentChannel: string | null = null;
  private cachedAppId: string | null = null;

  /**
   * Directly get the configured Agora App ID from environment variables or backend
   */
  public getAppId(): string {
    if (this.cachedAppId) return this.cachedAppId;
    const envAppId =
      import.meta.env.VITE_AGORA_APP_ID ||
      (import.meta.env as any).AGORA_APP_ID ||
      '';
    const cleanId = String(envAppId).trim().replace(/^["']|["']$/g, '');
    this.cachedAppId = cleanId;
    return cleanId;
  }

  /**
   * Initialize or retrieve Agora RTC client
   */
  public getClient(): IAgoraRTCClient {
    if (!this.client) {
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return this.client;
  }

  /**
   * Join an Agora RTC Channel and bind remote feeds to container
   */
  public async join(config: AgoraSessionConfig): Promise<boolean> {
    // Directly resolve Agora App ID from config, environment variable, or backend config endpoint
    let appId = config.appId || this.getAppId();

    // Sanitize UID: remove any non-alphanumeric characters (like # in #USER7821)
    const rawUid = config.uid ? String(config.uid) : 'user_0';
    const cleanUid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '') || `user_${Date.now() % 10000}`;

    // 1. Resolve credentials: token from config, env, or dynamic backend generation
    let tokenToUse: string | null = config.token || import.meta.env.VITE_AGORA_TOKEN || null;

    try {
      const tokenRes = await fetch(
        `/api/agora-token?channel=${encodeURIComponent(config.channel)}&uid=${encodeURIComponent(cleanUid)}`
      );
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        if (data.appId && !appId) {
          appId = String(data.appId).trim().replace(/^["']|["']$/g, '');
          this.cachedAppId = appId;
        }
        if (data.token) {
          tokenToUse = data.token;
          console.log('[Agora RTC] Acquired dynamic token from backend server');
        }
      }
    } catch {
      // Backend offline or unreachable; continue
    }

    // If no real Agora App ID is provided yet, operate in WebRTC Preview mode
    if (!appId || appId === 'demo-agora-app-id') {
      console.info(
        `[Agora RTC SDK] Operating in WebRTC Preview mode for channel: ${config.channel}.`
      );
      this.currentChannel = config.channel;
      this.isJoined = true;
      this.isFallbackMode = true;
      this.fallbackNotice = null;
      config.onFallback?.('DEMO_SHELL');
      return true;
    }

    try {
      const client = this.getClient();

      // Clean up previous listeners
      client.removeAllListeners();

      // Setup Remote User Event Handlers
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
        try {
          await client.subscribe(user, mediaType);
          console.log(`[Agora RTC] Subscribed to remote user ${user.uid} (${mediaType})`);

          if (mediaType === 'video' && user.videoTrack) {
            const container = document.getElementById(config.containerId);
            if (container) {
              user.videoTrack.play(container);
            }
          }

          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.play();
          }

          config.onRemoteTrackReady?.(mediaType, user);
        } catch (subErr) {
          console.warn('[Agora RTC] Remote stream subscription note:', subErr);
        }
      });

      client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora RTC] Remote user joined: ${user.uid}`);
        config.onUserJoined?.(user);
      });

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora RTC] Remote user left: ${user.uid}`);
        config.onUserLeft?.(user);
      });

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
        console.log(`[Agora RTC] Remote user unpublished: ${user.uid} (${mediaType})`);
        config.onRemoteTrackUnpublished?.(mediaType, user);
      });

      // 2. Join Channel with console guard against internal SDK rollback noise
      const origConsoleError = console.error;
      let joinError: any = null;
      try {
        console.error = (...args: any[]) => {
          const first = typeof args[0] === 'string' ? args[0] : '';
          if (
            first.includes('Agora-SDK') ||
            first.includes('CAN_NOT_GET_GATEWAY_SERVER') ||
            first.includes('invalid vendor key')
          ) {
            return;
          }
          origConsoleError.apply(console, args);
        };

        const assignedUid = await client.join(
          appId,
          config.channel,
          tokenToUse || null,
          cleanUid
        );
        console.log(`[Agora RTC] Successfully joined channel ${config.channel} with UID: ${assignedUid}`);
      } catch (err) {
        joinError = err;
      } finally {
        console.error = origConsoleError;
      }

      if (joinError) {
        throw joinError;
      }

      // 3. Create and Publish Local Camera/Mic Tracks safely without failing if a device is missing
      try {
        // Option A: Reuse existing tracks from browser localStream if available
        if (config.localStream) {
          const vTrack =
            config.localStream.getVideoTracks().find((t) => t.readyState === 'live') ||
            config.localStream.getVideoTracks()[0];
          if (vTrack && vTrack.readyState !== 'ended') {
            try {
              this.localVideoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: vTrack });
            } catch (vErr) {
              console.info('[Agora RTC] Custom video track note:', vErr);
            }
          }

          const aTrack =
            config.localStream.getAudioTracks().find((t) => t.readyState === 'live') ||
            config.localStream.getAudioTracks()[0];
          if (aTrack && aTrack.readyState !== 'ended') {
            try {
              this.localAudioTrack = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: aTrack });
            } catch (aErr) {
              console.info('[Agora RTC] Custom audio track note:', aErr);
            }
          }
        }

        // Option B: Safely try camera video track independently if not already created
        if (!this.localVideoTrack) {
          try {
            this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
              encoderConfig: '480p_1'
            });
          } catch (camErr: any) {
            console.info('[Agora RTC] Camera device unavailable or not found, continuing without camera track.');
          }
        }

        // Option C: Safely try microphone audio track independently if not already created
        if (!this.localAudioTrack) {
          try {
            this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
              AEC: true,
              ANS: true
            });
          } catch (micErr: any) {
            console.info('[Agora RTC] Microphone device unavailable or not found, continuing without microphone track.');
          }
        }

        const tracksToPublish: (ILocalAudioTrack | ILocalVideoTrack)[] = [];
        if (this.localAudioTrack) tracksToPublish.push(this.localAudioTrack);
        if (this.localVideoTrack) tracksToPublish.push(this.localVideoTrack);

        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
          console.log(`[Agora RTC] Published ${tracksToPublish.length} local track(s) to live channel`);
        } else {
          console.info('[Agora RTC] Joined channel in subscriber mode (no physical camera/mic detected).');
        }
      } catch (trackErr: any) {
        console.warn('[Agora RTC] Media track setup notice:', trackErr?.message || trackErr);
      }

      this.isJoined = true;
      this.isFallbackMode = false;
      this.fallbackNotice = null;
      this.currentChannel = config.channel;
      return true;
    } catch (joinErr: any) {
      const errMsg = joinErr?.message || String(joinErr);
      const isDynamicKeyErr =
        errMsg.includes('dynamic use static key') ||
        errMsg.includes('CAN_NOT_GET_GATEWAY_SERVER') ||
        joinErr?.code === 'CAN_NOT_GET_GATEWAY_SERVER' ||
        joinErr?.flag === 4096;

      // Reset client instance to clean up rollback state
      try {
        if (this.client) {
          await this.client.leave();
        }
      } catch {
        // absorb cleanup error
      }
      this.client = null;

      this.isJoined = true;
      this.isFallbackMode = true;
      this.currentChannel = config.channel;

      if (isDynamicKeyErr) {
        this.fallbackNotice = 'TOKEN_REQUIRED';
        console.info(
          '[Agora RTC] Note: Project requires App Certificate or dynamic Token. Running in WebRTC Preview mode seamlessly.'
        );
      } else {
        this.fallbackNotice = null;
        console.info('[Agora RTC] Operating in WebRTC Preview mode:', errMsg);
      }

      config.onFallback?.(this.fallbackNotice || 'PREVIEW_FALLBACK');
      return true;
    }
  }

  /**
   * Leave Agora Channel and clean up tracks
   */
  public async leave(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      if (this.client && this.isJoined) {
        await this.client.leave();
        console.log('[Agora RTC] Left channel');
      }
    } catch (err) {
      console.warn('[Agora RTC] Teardown note:', err);
    } finally {
      this.client = null;
      this.isJoined = false;
      this.isFallbackMode = false;
      this.fallbackNotice = null;
      this.currentChannel = null;
    }
  }

  /**
   * Toggle local microphone audio
   */
  public setAudioEnabled(enabled: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(enabled);
    }
  }

  /**
   * Toggle local camera video
   */
  public setVideoEnabled(enabled: boolean) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(enabled);
    }
  }

  public getChannel(): string | null {
    return this.currentChannel;
  }

  public getIsJoined(): boolean {
    return this.isJoined;
  }

  public getIsFallbackMode(): boolean {
    return this.isFallbackMode;
  }

  public getFallbackNotice(): string | null {
    return this.fallbackNotice;
  }
}

export const agoraService = new AgoraService();
