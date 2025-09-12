class PcmRecorder {
    constructor(sample_rate) {
        if (!sample_rate)
            sample_rate = 8000
        this.onFrameData = null // 录音回调（buffer)
        this.onNoticeText = null  // 提示消息通知(text)
        this.hasGetUserMedia = false
        this.sample_rate = sample_rate
        this.samples_per_frame = sample_rate / 50
        this.bytes_per_frame = 2 * this.samples_per_frame
        this.ready = false
        this.__audio_stream = null
        this.__audio_context = null
        this.__audio_input = null
        this.__record_processor = null
        this.__buffer_data = new ArrayBuffer(this.bytes_per_frame)
        this.__buffer_size = 0
    }

    requestMicrophone() {
        let getUserMedia;
        if (navigator.mediaDevices) {
            getUserMedia = navigator.mediaDevices
                .getUserMedia
                .bind(navigator.mediaDevices)
        } else if (navigator.getUserMedia) {
            getUserMedia = navigator.getUserMedia
        }

        if (getUserMedia) {
            this.hasGetUserMedia = true
            getUserMedia({
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })
                .then(stream => {
                    this.__audio_stream = stream
                    this.ready = true
                }).catch(error => {
                console.error("申请麦克风权限失败", error)
                this.__emit_notice_text("申请麦克风权限失败: " + error)
            })
        } else {
            this.hasGetUserMedia = false
        }
    }

    startRecord() {
        if (this.__audio_stream == null) {
            console.log(this.ready);
            console.error("stream not available")
            return;
        }

        if (this.__audio_context) {
            this.__audio_context.resume()
            return;
        }

        this.__audio_context = new AudioContext({
            sampleRate: this.sample_rate
        })

        // creates an audio node from the microphone incoming stream
        try {
            this.__audio_input = this.__audio_context.createMediaStreamSource(this.__audio_stream);
        } catch (e) {
            this.__emit_notice_text(e.toString())
            this.__audio_context = null
            console.info("error", e)
            return
        }

        const bufferSize = 512 * this.sample_rate / 8000;
        const numberOfInputChannels = 1;
        const numberOfOutputChannels = 1;

console.info(`bufferSize=${bufferSize}`)
        if (this.__audio_context.createScriptProcessor) {
            this.__record_processor = this.__audio_context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        } else {
            this.__record_processor = this.__audio_context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
        }
        this.__record_processor.onaudioprocess = function (e) {
            const floatSamples = e.inputBuffer.getChannelData(0)
            const waveFrame = this.__decode_to_int16_samples(floatSamples, this.__audio_context.sampleRate, this.sample_rate);

            let srcView = new Int16Array(waveFrame)
            let view = new Int16Array(this.__buffer_data)
            for (let i = 0; i < srcView.length; i++) {
                view[this.__buffer_size++] = srcView[i]
                if (this.__buffer_size === this.samples_per_frame) {
                    if (this.onFrameData) {
                        this.onFrameData(this.__buffer_data)
                    }
                    this.__buffer_size = 0
                }
            }
        }.bind(this)

        this.__audio_input.connect(this.__record_processor)
        this.__record_processor.connect(this.__audio_context.destination)
    }

    stopRecord() {
        if (this.__audio_context) {
            this.__audio_context.suspend().then(r => r)
        }
    }

    __emit_notice_text(text) {
        if (this.onNoticeText && text) {
            this.onNoticeText(text)
        }
    }

    // 把录音得到的原始音频重复采样到指定的频率，并转换成 Int16 格式（原始格式为 Float）
    __decode_to_int16_samples(source_audio_frame, source_rate, dest_rate) {
        const audioFrame = this.__down_sample_audio_frame(source_audio_frame, source_rate, dest_rate);

        if (!audioFrame) {
            return null;
        }

        return this.__to_int16_pcm(audioFrame);
    }

    __down_sample_audio_frame(src_frame, src_rate, dest_rate) {

        if (dest_rate === src_rate || dest_rate > src_rate) {
            return src_frame;
        }

        const ratio = src_rate / dest_rate;
        const dstLength = Math.round(src_frame.length / ratio);
        const dstFrame = new Float32Array(dstLength);
        let srcOffset = 0;
        let dstOffset = 0;
        while (dstOffset < dstLength) {
            const nextSrcOffset = Math.round((dstOffset + 1) * ratio);
            let accum = 0;
            let count = 0;
            while (srcOffset < nextSrcOffset && srcOffset < src_frame.length) {
                accum += src_frame[srcOffset++];
                count++;
            }
            dstFrame[dstOffset++] = accum / count;
        }

        return dstFrame;
    }

    __pcm_float_to_int16(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
    }

    __to_int16_pcm(samples) {
        const bitDepth = 16;
        const bytesPerSample = bitDepth / 8;
        const offset = 0;
        let buffer = new ArrayBuffer(samples.length * bytesPerSample);
        let view = new DataView(buffer);
        this.__pcm_float_to_int16(view, offset, samples);
        return buffer;
    }
}

// Export to global scope
window.PcmRecorder = PcmRecorder;

