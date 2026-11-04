import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import {
  FunctionDeclaration,
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const BEATSHREDDER_SYSTEM_INSTRUCTION = `You are the Beatshredder Live Gaming Cohost ("Shredder Live Cohost"), an electric, hilarious AI co-host sitting beside a gamer while they play games like Fortnite and record/livestream their gameplay.
Brand: Beatshredder.
Tagline: "Shred Them Beats Boy."
Motto: "Be Unique, Be You."

Core Gaming & Trash-Talk Rules:
- You can HEAR the player continuously through an always-on open mic (NO push-to-talk) and SEE their gameplay screen in real time via 1 FPS video frames.
- Your primary job is to TALK SHIT to the player the whole game like a savage, hilarious competitive duo partner / couch co-op best friend!
- Watch their screen closely: roast their drop spot, call out grey loot, mock whiffed shotgun shots, call them out for camping in a bush or box, watch their health/shield bar and storm circle, roast them when they get eliminated and sent back to the lobby, and give backhanded hype when they actually hit a clip.
- Keep spoken responses fast and punchy (1 to 3 sentences max) so the conversation flows automatically without interrupting gameplay flow.
- Use your tools actively! When roasting a whiffed shot or death, call fireBeatPad with "rimshot_roast" or "drop_it". When they clutch up, call fireBeatPad with "air_horn" or "victory_fanfare" and boost the Hype Meter.`;

const cohostTools: FunctionDeclaration[] = [
  {
    name: 'fireBeatPad',
    description:
      'Fires a beat, 808 drop, air horn, or stinger on the Beatshredder Beat Board when the streamer says the word (like "drop it") or to punctuate a hype moment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        padId: {
          type: Type.STRING,
          description:
            'One of: drop_it, air_horn, shred_beat, boom_bap, laser_hype, crowd_roar, rimshot_roast, victory_fanfare',
        },
        reason: {
          type: Type.STRING,
          description: 'Short reason for firing the pad',
        },
      },
      required: ['padId'],
    },
  },
  {
    name: 'adjustHypeMeter',
    description:
      'Raises or lowers the on-screen Hype Meter (delta between -25 and +30) and optionally triggers a milestone callout banner.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        delta: {
          type: Type.NUMBER,
          description: 'Amount to change the hype meter, e.g. 15 or -10',
        },
        milestoneAnnouncement: {
          type: Type.STRING,
          description: 'Optional milestone callout text if a milestone was reached',
        },
      },
      required: ['delta'],
    },
  },
  {
    name: 'triggerGameAction',
    description:
      'Starts an interactive LIVE game, awards points, or declares a winner on screen.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        gameType: {
          type: Type.STRING,
          description:
            'One of: trivia_sprint, either_or, finish_lyric, guess_beat, gift_race',
        },
        action: {
          type: Type.STRING,
          description: 'One of: start, reveal_answer, declare_winner, add_gift_points',
        },
        winnerName: {
          type: Type.STRING,
          description: 'Optional username of the winner',
        },
      },
      required: ['gameType', 'action'],
    },
  },
  {
    name: 'announceNextSongRequest',
    description: 'Advances the Song Request Queue to the next requested beat style or vibe.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        announcementNote: {
          type: Type.STRING,
          description: 'Short intro note for the next beat request',
        },
      },
    },
  },
  {
    name: 'saveStreamClip',
    description:
      'Saves the last 30 seconds of the stream into the local Clips vault when the streamer says "clip it" or a hilarious moment happens.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        funniestMoment: {
          type: Type.STRING,
          description: 'Description of the funniest or hypest moment from the last 30 seconds',
        },
      },
    },
  },
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', 'http://localhost:3000').pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Complete handshake for any auxiliary/HMR WebSocket so @vite/client never throws "WebSocket closed without opened"
      wss.handleUpgrade(request, socket, head, (ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'connected' }));
        }
      });
    }
  });

  const PERSONA_CONFIGS: Record<
    string,
    { voiceName: string; systemAddon: string; introPrompt: string }
  > = {
    beatshredder: {
      voiceName: 'Puck',
      systemAddon:
        'Active Persona: Beatshredder (High-Energy Original). Catchphrases: "Shred Them Beats Boy!" and "Be Unique, Be You."',
      introPrompt:
        'The streamer just tapped GO LIVE! Introduce the stream out loud right now in the Beatshredder voice—high energy, funny, direct, mention "Shred Them Beats Boy" or "Be Unique, Be You", and fire the air_horn or drop_it pad!',
    },
    sarcastic: {
      voiceName: 'Charon',
      systemAddon:
        'Active Persona: DJ Frostbite (Sarcastic & Deadpan Studio Veteran). Catchphrase: "Another 808? Groundbreaking. Keep that tempo locked." Keep your humor dry, witty, and playfully sarcastic without ever getting mean.',
      introPrompt:
        'The streamer just tapped GO LIVE! Introduce the stream in your dry, witty DJ Frostbite sarcastic persona, use your catchphrase "Another 808? Groundbreaking. Keep that tempo locked.", and fire the rimshot_roast or drop_it pad!',
    },
    encouraging: {
      voiceName: 'Kore',
      systemAddon:
        'Active Persona: Coach Nova (Encouraging & Uplifting Hype Coach). Catchphrase: "Every bar in this room is pure gold—shine on fam!" Celebrate every single moment with warm, championship positivity.',
      introPrompt:
        'The streamer just tapped GO LIVE! Introduce the stream as Coach Nova with maximum uplifting encouragement, use your catchphrase "Every bar in this room is pure gold—shine on fam!", and fire the victory_fanfare pad!',
    },
    goofy: {
      voiceName: 'Fenrir',
      systemAddon:
        'Active Persona: MC Kazoo (Goofy & Chaotic Soundboard Gremlin). Catchphrase: "Beep boop drop the soup—wait no, drop the beat!" Use silly rhymes, punny jokes, and chaotic fun.',
      introPrompt:
        'The streamer just tapped GO LIVE! Introduce the stream as MC Kazoo with goofy, silly rhymes, say "Beep boop drop the soup—wait no, drop the beat!", and fire the air_horn pad!',
    },
  };

  wss.on('connection', async (clientWs: WebSocket, request) => {
    let sessionPromise: ReturnType<GoogleGenAI['live']['connect']> | null = null;
    let isClosed = false;

    const reqUrl = new URL(request?.url || '/live', 'http://localhost:3000');
    const personaKey = reqUrl.searchParams.get('persona') || 'beatshredder';
    const personaCfg = PERSONA_CONFIGS[personaKey] || PERSONA_CONFIGS.beatshredder;

    const sendToClient = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    try {
      const ai = getAiClient();
      sessionPromise = ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: personaCfg.voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: cohostTools }],
          systemInstruction: `${BEATSHREDDER_SYSTEM_INSTRUCTION}\n\n${personaCfg.systemAddon}`,
        },
        callbacks: {
          onopen: () => {
            sendToClient({ type: 'connected' });
          },
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              sendToClient({
                type: 'inputTranscript',
                text: content.inputTranscription.text,
              });
            }

            if (content?.outputTranscription?.text) {
              sendToClient({
                type: 'outputTranscript',
                text: content.outputTranscription.text,
              });
            }

            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                sendToClient({
                  type: 'audio',
                  audio: part.inlineData.data,
                });
              }
              if (part.text) {
                sendToClient({
                  type: 'outputTranscript',
                  text: part.text,
                });
              }
            }

            if (content?.interrupted) {
              sendToClient({ type: 'interrupted' });
            }

            if (message.toolCall?.functionCalls?.length) {
              const responses = message.toolCall.functionCalls.map((call) => {
                sendToClient({
                  type: 'toolCall',
                  name: call.name,
                  args: call.args ?? {},
                });
                return {
                  id: call.id,
                  name: call.name,
                  response: { result: 'Executed on stage UI' },
                };
              });

              sessionPromise
                ?.then((s) => {
                  if (!isClosed) {
                    s.sendToolResponse({ functionResponses: responses });
                  }
                })
                .catch(() => {});
            }
          },
          onerror: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Gemini Live session error';
            sendToClient({ type: 'error', message: msg });
          },
          onclose: () => {
            sendToClient({ type: 'closed' });
          },
        },
      });

      const activeSession = await sessionPromise;
      activeSession.sendRealtimeInput({
        text: personaCfg.introPrompt,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not initialize Gemini Live session. Check GEMINI_API_KEY in Settings > Secrets.';
      sendToClient({ type: 'error', message });
    }

    clientWs.on('message', (raw) => {
      if (!sessionPromise || isClosed) return;
      try {
        const parsed = JSON.parse(raw.toString()) as {
          audio?: string;
          video?: string;
          text?: string;
        };
        sessionPromise
          .then((session) => {
            if (isClosed) return;
            if (parsed.audio) {
              session.sendRealtimeInput({
                audio: {
                  data: parsed.audio,
                  mimeType: 'audio/pcm;rate=16000',
                },
              });
            }
            if (parsed.video) {
              session.sendRealtimeInput({
                video: {
                  data: parsed.video,
                  mimeType: 'image/jpeg',
                },
              });
            }
            if (parsed.text) {
              session.sendRealtimeInput({
                text: parsed.text,
              });
            }
          })
          .catch(() => {});
      } catch {
        // Ignore malformed frame
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      sessionPromise
        ?.then((session) => {
          try {
            session.close();
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    });
  });

  // Auxiliary endpoint for one-tap cohost lines & recaps when offline or on-demand
  app.post('/api/cohost/react', async (req, res) => {
    const { prompt, context, fallbackLine, persona, videoFrame } = req.body as {
      prompt?: string;
      context?: string;
      fallbackLine?: string;
      persona?: string;
      videoFrame?: string;
    };
    const defaultReply =
      fallbackLine ||
      'Yo! Beatshredder in the building—watching your screen live, stop looting like a bot and take a fight!';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({ text: defaultReply });
      return;
    }

    const personaCfg = PERSONA_CONFIGS[persona || 'beatshredder'] || PERSONA_CONFIGS.beatshredder;

    try {
      const ai = getAiClient();
      const textPrompt = `${context ? `Stream Context: ${context}\n\n` : ''}Task: ${prompt || 'Roast the streamer gameplay in 2 punchy sentences!'}`;
      const contents = videoFrame
        ? {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: videoFrame,
                },
              },
              { text: textPrompt },
            ],
          }
        : textPrompt;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: `${BEATSHREDDER_SYSTEM_INSTRUCTION}\n\n${personaCfg.systemAddon}`,
        },
      });
      res.json({ text: response.text || defaultReply });
    } catch {
      res.json({ text: defaultReply });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Shredder Live Cohost running on http://localhost:${PORT}`);
  });
}

startServer();
