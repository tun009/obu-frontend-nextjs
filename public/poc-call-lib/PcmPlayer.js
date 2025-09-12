class PCMPlayer {
    constructor(option) {
        this.init(option);
    }

    //初始化
    init(option) {
        let defaults = {
            inputCodec: 'Int16',//编码格式
            channels: 1,//声道
            sampleRate: 8000, //采样率
            flushTime: 1000,
        };
        this.option = Object.assign({}, defaults, option)
        this.samples = new Int16Array(0)
        this.flush = this.flush.bind(this)
        this.currFrag = {
            startTime: 0,
            duration: 0
        }
        this.nextFrag = {
            startTime: 0,
            duration: 0
        }
        this.interval = setInterval(this.flush)
        this.createContext()
    };


    //创建AudioContext
    createContext() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(
            {latencyHint: "playback"}
        );
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 1.0;
        this.gainNode.connect(this.audioCtx.destination);
    }


    //设置音量
    volume(volume) {
        this.gainNode.gain.value = volume;
    };

    //判断是否数组
    isTypedArray(data) {
        return (data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer);
    };

    //缓存数据
    feed(data) {
        if (!this.isTypedArray(data) || !this.samples) return;

        let tmp = new Int16Array(this.samples.length + data.length);
        tmp.set(this.samples, 0);
        tmp.set(data, this.samples.length);
        this.samples = tmp;
    };

    //播放数据
    flush() {
        if (!this.samples.length || this.nextFrag.duration > 0) {
            return
        }

        const BATCH_TIME_MS = this.option.flushTime > 180 ? this.option.flushTime : 180

        let samples_time_ms = this.samples.length * 1000 / this.option.sampleRate
        if (this.currFrag.startTime + this.currFrag.duration + BATCH_TIME_MS / 1000 < this.audioCtx.currentTime
            && samples_time_ms + 0.1 < BATCH_TIME_MS) {
            return
        }

        if (this.currFrag.startTime + this.currFrag.duration > this.audioCtx.currentTime + 0.01)
            return;


        this.nextFrag.duration = (this.samples.length / this.option.sampleRate)
        this.nextFrag.startTime = this.currFrag.startTime + this.currFrag.duration

        this.audioCtx.decodeAudioData(
            this.pcmToWav(this.samples, this.option.sampleRate).buffer
        ).then(
            buffer => {
                this.currFrag = this.nextFrag

                //用audio播pcm
                if (this.currFrag.startTime + 0.02 < this.audioCtx.currentTime) {
                    console.info(`时间调整 this.startTime=${this.currFrag.startTime} audioCtx.currentTime=${this.audioCtx.currentTime}`)
                    this.currFrag.startTime = this.audioCtx.currentTime
                }

                let bufferSource = this.audioCtx.createBufferSource();
                bufferSource.buffer = buffer;
                bufferSource.connect(this.gainNode);

                bufferSource.start(this.currFrag.startTime);

                this.nextFrag = {
                    startTime: this.currFrag.startTime + this.currFrag.duration,
                    duration: 0
                }
            }).catch(e => {
            console.log("Failed to decode the file", e);
            this.currFrag = this.nextFrag
            this.nextFrag = {
                startTime: this.currFrag.startTime + this.currFrag.duration,
                duration: 0
            }
        })

        this.samples = new Int16Array(0)
    };

    //销毁播放器
    destroy() {
        this.interval && clearInterval(this.interval);
        this.samples = null;
        this.audioCtx && this.audioCtx.close();
        this.audioCtx = null;
    };

    //pcm转wav
    pcmToWav(res, sr) {
        const sampleRate = sr; //采样率
        const bitRate = 16; //采样位数
        const size = res.length;
        const dataLength = size * (bitRate / 8);
        const buffer = new ArrayBuffer(44 + dataLength);
        const data = new DataView(buffer);
        let offset = 0;
        let writeString = function (str) {
            for (let i = 0; i < str.length; i++, offset++) {
                data.setUint8(offset, str.charCodeAt(i));
            }
        };
        let write16 = function (v) {
            data.setUint16(offset, v, true);
            offset += 2;
        };
        let write32 = function (v) {
            data.setUint32(offset, v, true);
            offset += 4;
        };
        // 资源交换文件标识符
        writeString('RIFF');
        // 下个地址开始到文件尾总字节数,即文件大小-8
        write32(36 + dataLength);
        // WAV文件标志
        writeString('WAVE');
        // 波形格式标志
        writeString('fmt ');
        // 过滤字节,一般为 0x10 = 16
        write32(16);
        // 格式类别 (PCM形式采样数据)
        write16(1);
        // 通道数
        write16(1);
        // 采样率,每秒样本数,表示每个通道的播放速度
        write32(sampleRate);
        // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
        write32(sampleRate * (bitRate / 8));
        // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
        write16(bitRate / 8);
        // 每样本数据位数
        write16(bitRate);
        // 数据标识符
        writeString('data');
        // 采样数据总数,即数据总大小-44
        write32(dataLength);
        // 写入采样数据
        for (let i = 0; i < size; i++, offset += 2) {
            data.setInt16(offset, res[i], true);
        }
        return data;
    }
}

// Export to global scope
window.PCMPlayer = PCMPlayer;

