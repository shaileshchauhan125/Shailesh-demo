class SoundManager {
    constructor() {
        // Priority 1: Core Actions
        this.sounds = {
            diceRollStart: new Audio('assets/audio/dice_roll_start.mp3'),
            diceRollEnd: new Audio('assets/audio/dice_roll_end.mp3'),
            tokenMove: new Audio('assets/audio/token_move.mp3'),
            tokenCapture: new Audio('assets/audio/capture.mp3'),
            tokenSafeHome: new Audio('assets/audio/safe_home.mp3'),
            yourTurnAlert: new Audio('assets/audio/your_turn.mp3'),

            // Priority 2: Feedback Sounds
            rollingASix: new Audio('assets/audio/roll_six.mp3'),
            tripleSixPenalty: new Audio('assets/audio/wah_wah.mp3'),
            buttonClick: new Audio('assets/audio/button_click.mp3'),
            invalidMove: new Audio('assets/audio/invalid_move.mp3'),
            gameStart: new Audio('assets/audio/game_start.mp3'),
            victory: new Audio('assets/audio/victory.mp3'),

            // Priority 3: Polish Sounds
            tokenSelect: new Audio('assets/audio/token_select.mp3'),
            blockade: new Audio('assets/audio/blockade.mp3'),
            opponentJoins: new Audio('assets/audio/opponent_joins.mp3'),
            chatMessage: new Audio('assets/audio/chat_pop.mp3'),
            emojiReaction: new Audio('assets/audio/boop.mp3'),
        };

        // Theme music tracks
        this.themeMusic = {
            cyberpunk: new Audio('assets/audio/cyberpunk.mp3'),
            egypt: new Audio('assets/audio/egypt.mp3'),
            jurassic: new Audio('assets/audio/jurassic.mp3'),
            space: new Audio('assets/audio/space.mp3'),
        };

        // Set theme music to loop
        Object.values(this.themeMusic).forEach(audio => {
            audio.loop = true;
            audio.volume = 0.3;
        });

        this.currentThemeAudio = null;
        this.isSfxMuted = false;
        this.isMusicMuted = false;
        this.sfxVolume = 0.5;
        this.musicVolume = 0.5;

        // Set default volumes
        this.sounds.tokenMove.volume = 0.5;
        this.sounds.buttonClick.volume = 0.3;
        this.sounds.yourTurnAlert.volume = 0.4;
    }

    play(name, options = {}) {
        if (this.isSfxMuted) return;

        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound not found: ${name}`);
            return;
        }

        const soundInstance = sound.cloneNode(true);
        soundInstance.volume = (options.volume || sound.volume) * this.sfxVolume;
        soundInstance.playbackRate = options.speed || 1;
        soundInstance.play().catch(e => console.error(`Error playing sound: ${name}`, e));
    }

    playThemeMusic(theme) {
        // Stop current theme music
        this.stopThemeMusic();

        if (this.isMusicMuted) return;

        const themeAudio = this.themeMusic[theme];
        if (!themeAudio) {
            console.warn(`Theme music not found: ${theme}`);
            return;
        }

        this.currentThemeAudio = themeAudio;
        themeAudio.volume = this.musicVolume;
        themeAudio.play().catch(e => console.error(`Error playing theme music: ${theme}`, e));
    }

    stopThemeMusic() {
        if (this.currentThemeAudio) {
            this.currentThemeAudio.pause();
            this.currentThemeAudio.currentTime = 0;
            this.currentThemeAudio = null;
        }
    }

    setSfxMuted(muted) {
        this.isSfxMuted = muted;
    }

    setMusicMuted(muted) {
        this.isMusicMuted = muted;
        if (muted) {
            this.stopThemeMusic();
        } else if (this.currentTheme) {
            this.playThemeMusic(this.currentTheme);
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentThemeAudio) {
            this.currentThemeAudio.volume = this.musicVolume;
        }
    }

    setCurrentTheme(theme) {
        this.currentTheme = theme;
    }

    // Legacy methods for backward compatibility
    setMuted(muted) {
        this.setSfxMuted(muted);
        this.setMusicMuted(muted);
    }

    toggleMute() {
        const newMutedState = !this.isSfxMuted;
        this.setSfxMuted(newMutedState);
        this.setMusicMuted(newMutedState);
        return newMutedState;
    }
}
