import './style.css'

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waveform');
    const ctx = canvas.getContext('2d');
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Function to resize canvas to match its display size
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set the actual size in memory (scaled for high-DPI displays)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale the canvas back down using CSS
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Reset any existing transform then scale for high-DPI correctly
        if (ctx.resetTransform) {
            ctx.resetTransform();
        } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.scale(dpr, dpr);
    }

    // Initial resize and setup resize listener
    setTimeout(resizeCanvas, 100); // Small delay to ensure CSS is applied
    window.addEventListener('resize', resizeCanvas);

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Ensure AudioContext is resumed (required in some browsers after user gesture)
            audioCtx.resume().catch(e => console.warn('AudioContext resume failed:', e));
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);

            function draw() {
                requestAnimationFrame(draw);
                analyser.getFloatTimeDomainData(dataArray);

                // Get current canvas dimensions
                const rect = canvas.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;

                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();

                const sliceWidth = width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i]; // -1 … 1
                    const y = (v * height / 3) + (height / 2);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }

                ctx.stroke();
            }

            draw();
        })
        .catch(err => {
            console.error('Microphone access denied:', err);
            // Add visual feedback for users
            const rect = canvas.getBoundingClientRect();
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Microphone access denied', rect.width / 2, rect.height / 2);
        });
});

