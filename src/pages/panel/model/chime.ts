const CHIME_NOTES_HZ = [880, 1175, 1568]
const NOTE_SECONDS = 0.16
const CHIME_VOLUME = 0.25

let audioContext: AudioContext | null = null

// O navegador só libera som depois de um toque na página; o painel chama isto
// no primeiro clique para o aviso de pedido novo tocar depois.
export function unlockChime(): void {
    try {
        audioContext ??= new AudioContext()
        void audioContext.resume()
    } catch (error) {
        console.warn('Som indisponível neste navegador', error)
    }
}

export function playNewOrderChime(): void {
    try {
        if (!audioContext) {
            return
        }

        const context = audioContext
        CHIME_NOTES_HZ.forEach((frequency, index) => {
            const startsAt = context.currentTime + index * NOTE_SECONDS
            const oscillator = context.createOscillator()
            const gain = context.createGain()
            oscillator.frequency.value = frequency
            gain.gain.setValueAtTime(CHIME_VOLUME, startsAt)
            gain.gain.exponentialRampToValueAtTime(0.001, startsAt + NOTE_SECONDS)
            oscillator.connect(gain).connect(context.destination)
            oscillator.start(startsAt)
            oscillator.stop(startsAt + NOTE_SECONDS)
        })
    } catch (error) {
        console.warn('Não deu para tocar o aviso de pedido novo', error)
    }
}
