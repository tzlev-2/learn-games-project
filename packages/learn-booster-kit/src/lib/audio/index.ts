export {
	createSoundPlayer,
	createUiSounds,
	playAudio,
	resolveSoundSrc,
	type AudioLike,
	type AudioFactory,
	type SoundDef,
	type SoundOptions,
	type SoundPlayer,
	type UiSoundName,
	type UiSounds,
	type PlayAudioOptions
} from './sound';
export {
	speakText,
	getDefaultTtsEnv,
	pickTtsEngine,
	type SpeakOptions,
	type TtsEnv,
	type FullyTts,
	type UtteranceLike,
	type SpeechSynthesisLike
} from './tts';
export {
	createVoiceAssetPlayer,
	voiceAssetUrl,
	type VoiceAsset,
	type VoiceAssetPlayer,
	type VoiceAssetPlayerOptions,
	type VoiceAssetDeps,
	type AudioContextLike,
	type DecodedAudio
} from './voice-assets';
