var app = new Vue({
    el: '#app',
    data: function () {
        return {
            sample_rate: 8000,
            extended_feature_on: false,
            api: null,
            client: null,
            player: null,
            recorder: null,
            account: {
                ws_url: '',
                user: '',
                pwd: '',
                token: 'any_token'
            },
            errorInfo: {
                on: false,
                message: '',
            },
            duplex: {
                customize: false,
                options: {
                    aec: true,
                    anr: true,
                    agc: true,
                    ring: true,
                    send: true,
                    recv: true,
                    codec: 'opus',
                    sample_rate: 8000,
                }
            },
            play: {
                local_file_id: 1,
                message: '',
            },
            volume: {
                ai_volume: 80,
                ao_volume: 50,
                message: '',
            },
            state: {
                profile: {},
                groups: [],
                members: [],
                tempGroupCode: '',
                groupMembers: {},
                callStatus: {
                    status: 0,
                    is_caller: true,
                    ms_code: '',
                    ms_name: '',
                    sid: ''
                },
                talking: {
                    ms_code: '',
                    ms_name: '',
                    message: '',
                },
                online: false,
                open: false,
            },
        }
    },
    mounted: function () {
        const url = new URL(window.location)
        if (url.protocol === 'file:') {
            this.errorInfo.on = true
            this.errorInfo.message = `提示：此 DEMO 使用 wasm 技术，大部分浏览器都不支持加载本地 wasm 文件(file://)，务必通过 http 服务器来访问此页面。如果您有使用 JetBrains 系列的 IDE（例如 Idea, PyCharm, WebStorm, CLion, Goland 等）,可以很通过您的IDE打开本HTML所在目录，然后很方便编辑和预览`
        } else if (url.protocol === 'http:') {
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
                this.errorInfo.on = true
                this.errorInfo.message = `提示：由于浏览器的安全策略，只有 https 的页面才允许获取麦克风录音权限。本页面不是 https 所以无权使用麦克风录音，所以不能说话`
            }
        }

        this.account.ws_url = localStorage.getItem('ws_url') || ''
        this.account.user = localStorage.getItem('user') || ''
        this.account.pwd = localStorage.getItem('pwd') || '123456'

        BePocApi().then(api => {
            this.api = api
            this.api._BeCodecInit()
            console.info("load client ok")
        }).catch(e => alert(`加载 wasm 失败 ${e}`))
    },
    methods: {
        openPoc: function () {
            localStorage.setItem('ws_url', this.account.ws_url)
            localStorage.setItem('user', this.account.user)
            localStorage.setItem('pwd', this.account.pwd)

            if ((new URL(this.account.ws_url)).pathname !== '/v1/ws/client') {
                alert(`错误：服务器地址路径应为 /v1/ws/client`)
                return;
            }

            if (!this.api) {
                alert('尚未初始化成功')
                return;
            }

            if (!this.player) {
                this.player = new PCMPlayer({
                    inputCodec: 'Int16', channels: 1, sampleRate: this.sample_rate, flushTime: 320
                })
            }

            if (!this.client) {
                console.info('create client')
                console.info('api is', this.api)
                this.client = new PocClient(this.api)

                this.client.setSampleRate(this.sample_rate)
                this.client.on('playFrame', function (event, data) {
                    let view = new DataView(data.buffer)

                    let buf = new Int16Array(data.byteLength / 2)

                    for (let i = 0; i < data.byteLength / 2; i++) {
                        buf[i] = view.getInt16(2 * i, true)
                    }

                    this.player.feed(buf)
                }.bind(this))

                this.client.on('msOnline', function (event, data) {
                    console.info(event, data)
                    this.state.members.filter(m => m.ms_code === data.ms_code).map(m => m.online = true)
                    for (let group_code in this.state.groupMembers) {
                        this.state.groupMembers[group_code].filter(m => m.ms_code === data.ms_code).map(m => m.online = true)
                    }
                }.bind(this))

                this.client.on('msOffline', function (event, data) {
                    console.info(event, data)
                    this.state.members.filter(m => m.ms_code === data.ms_code).map(m => m.online = false)
                    for (let group_code in this.state.groupMembers) {
                        this.state.groupMembers[group_code].filter(m => m.ms_code === data.ms_code).map(m => m.online = false)
                    }
                }.bind(this))

                this.client.on('tempGroup', function (event, data) {
                    console.info(event, data)
                    this.state.tempGroupCode = data.group_code
                    if (data.group_code) {
                        this.state.members = data.members
                    } else {
                        this.state.members = this.state.groupMembers[this.state.profile.group_code]
                    }
                }.bind(this))

                this.client.on('playLocalResult', function (event, data) {
                    console.info(event, data)
                    this.setPlayMessage(data.message)
                }.bind(this))


                this.client.on('quitResult', function (event, data) {
                    console.info(event, data)
                    this.setPlayMessage(data.message || '退出指令已发送')
                }.bind(this))

                this.client.on('rebootResult', function (event, data) {
                    console.info(event, data)
                    this.setPlayMessage(data.message || '重启指令已发送')
                }.bind(this))

                this.client.on('saveLocalResult', function (event, data) {
                    console.info(event, data)
                    this.setPlayMessage(data.message || '保存指令已发送')
                }.bind(this))

                this.client.on('setAoVolumeResult', function (event, data) {
                    console.info(event, data)
                    this.setVolumeMessage(data.message || "设置音量成功")
                }.bind(this))

                this.client.on('setAiVolumeResult', function (event, data) {
                    console.info(event, data)
                    this.setVolumeMessage(data.message || "设置音量成功")
                }.bind(this))


                this.client.on('userProfile', function (event, data) {
                    console.info(event, data)
                    this.state.profile = data
                }.bind(this))

                this.client.on('enterGroup', function (event, data) {
                    console.info(event, data)
                    if (data.ms_code === this.state.profile.ms_code) {
                        this.state.profile.group_code = data.group_code
                        this.state.profile.group_name = data.group_name
                    }

                    for (let i = 0; i < this.state.groups.length; i++) {
                        if (this.state.groups[i].group_code === data.group_code) {
                            this.state.members = this.state.groups[i].members
                            break
                        }
                    }
                }.bind(this))
                this.client.on('groupList', function (event, data) {
                    console.info('群组列表', data)
                    this.state.groups = data.groups
                }.bind(this))

                this.client.on('memberList', function (event, data) {
                    this.state.groupMembers[data.group_code] = data.members
                    for (let i = 0; i < this.state.groups.length; i++) {
                        if (this.state.groups[i].group_code === data.group_code) {
                            this.state.groups[i].members = data.members
                            break
                        }
                    }
                    if (data.group_code === this.state.profile.group_code) {
                        this.state.members = data.members
                    }
                    console.info(data)
                }.bind(this))

                this.client.on('startTalk', function (event, data) {
                    console.info(event, data)
                    this.state.talking.ms_code = data.ms_code
                    this.state.talking.ms_name = data.ms_name
                }.bind(this))
                this.client.on('stopTalk', function (event, data) {
                    console.info(event, data)
                    this.state.talking.ms_name = ''
                    this.state.talking.ms_code = ''
                }.bind(this))
                this.client.on('talkDenied', function (event, data) {
                    console.info("说话失败: " + data.message)
                    this.setTalkingMessage("说话失败: " + data.message)
                    this.state.talking.ms_code = ''
                    this.state.talking.ms_name = ''
                }.bind(this))

                this.client.on('callStatus', function (event, data) {
                    console.info(event, data)
                    if (data.status !== 0) {
                        this.state.callStatus = data
                    } else {
                        this.state.callStatus.status = data.status
                        this.state.callStatus.ms_name = data.ms_name
                        this.state.callStatus.ms_code = data.ms_code
                        this.state.callStatus.sid = data.sid
                        this.state.callStatus.is_caller = false
                    }
                }.bind(this))

                this.client.on('onlineStatus', function (event, data) {
                    this.state.online = data.status === 3
                }.bind(this))

                this.client.on('sendSmsResult', function (event, data) {
                    console.info(event, data)
                })
            }

            if (!this.recorder) {
                this.recorder = new PcmRecorder(this.sample_rate)
                this.recorder.requestMicrophone()
                this.recorder.onFrameData = this.client.sendFrame.bind(this.client)

                this.client.on('startRecord', this.recorder.startRecord.bind(this.recorder))
                this.client.on('stopRecord', this.recorder.stopRecord.bind(this.recorder))
            }

            this.client.setLogLevel(0)
            console.log('setUsername')
            this.client.setUsername(this.account.user);
            this.client.setTimestamp("1649209905")
            this.client.setToken(this.account.token)
            this.client.setPassword(this.account.pwd);
            this.client.setUrl(this.account.ws_url);
            this.client.openPoc();
            this.state.open = true

        },
        closePoc: function () {
            if (this.client) {
                this.client.closePoc()
                this.state.open = false
                this.state.online = false
                this.state.groups = []
            }
            this.state.members = []
            this.state.groupMembers = {}
            this.state.callStatus = {
                status: 0,
                is_caller: false,
                ms_code: '',
                ms_name: '',
                sid: ''
            }
            this.state.talking = {
                ms_code: '',
                ms_name: '',
                message: '',
            }
            this.state.tempGroupCode = ''
        },
        startTalk: function () {
            if (this.client) this.client.startTalk()
        },
        stopTalk: function () {
            if (this.client) this.client.stopTalk()
        },
        enterGroup: function (group_code) {
            if (this.client) this.client.switchGroup(group_code)
        },
        createTempGroup: function (ms_code) {
            if (this.client && ms_code) {
                this.client.createTempGroup([ms_code])
            }
        },
        quitTempGroup: function () {
            if (this.client) {
                this.client.quitTempGroup()
            }
        },
        duplexCall: function (ms_code) {
            if (this.client) {
                if (this.duplex.customize) {
                    this.client.duplexCall(ms_code, this.duplex.options)
                } else {
                    this.client.duplexCall(ms_code)
                }
            }
        },
        duplexAnswer: function () {
            if (this.client)
                this.client.duplexAnswer(200)
        },
        duplexBye: function () {
            if (this.client) this.client.duplexBye()
        },
        mute: function () {
            if (this.client) this.client.setMute(true)
        },
        unmute: function () {
            if (this.client) this.client.setMute(false)
        },
        muteSpk: function () {
            if (this.client) this.client.muteSpk(true)
        },
        unmuteSpk: function () {
            if (this.client) this.client.muteSpk(false)
        },
        postPlayLocal: function (ms_code) {
            if (this.client) this.client.postPlayLocal(ms_code, this.play.local_file_id, 2000)
        },
        postSetAoVolume: function (member) {
            if (this.client) this.client.postSetAoVolume(member.ms_code, member.settings['2'], 2000)
        },
        postSetAiVolume: function (member) {
            if (this.client) this.client.postSetAiVolume(member.ms_code, member.settings['1'], 2000)
        },
        postQuitCommand: function (member) {
            if (this.client) this.client.postQuitCommand(member.ms_code, 2000)
        },
        postRebootCommand: function (member) {
            if (this.client) this.client.postRebootCommand(member.ms_code, 2000)
        },
        sendSms: function (member, text) {
            console.info(`sendSms ${member.ms_code} ${text}`)
            if (this.client) this.client.sendSms(member.ms_code, text)
        },
        postSaveLocal: function (ms_code) {
            if (!this.client) {
                alert('沿未初始化')
                return
            }
            let files = document.getElementById("files").files
            if (files.length === 0) {
                alert('未选择音频文件')
                return
            }

            let selectedFile = files[0]
            let name = selectedFile.name
            let size = selectedFile.size

            console.log(`name=${name} size=${size}`)
            let reader = new FileReader()
            reader.readAsArrayBuffer(selectedFile)

            const self = this
            reader.onload = function () {
                console.log(this.result)
                self.client.postSaveLocal(ms_code,
                    self.play.local_file_id,
                    name,
                    this.result,
                    2000)
            }
        },
        setPlayMessage: function (message) {
            this.play.message = message
            setTimeout(function () {
                if (this.play.message === message)
                    this.play.message = ''
            }.bind(this), 3000)
        },
        setTalkingMessage: function (message) {
            this.state.talking.message = message
            setTimeout(function () {
                if (this.state.talking.message === message)
                    this.state.talking.message = ''
            }.bind(this), 3000)
        },
        setVolumeMessage: function (message) {
            this.volume.message = message
            setTimeout(function () {
                if (this.volume.message === message)
                    this.volume.message = ''
            }.bind(this), 3000)
        },
        statusName: function (status) {
            switch (status) {
                case 0:
                    return "空闲"
                case 100:
                    return "正在拨打"
                case 180:
                    return "正在振铃"
                case 200:
                    return "已接通"
                default:
                    return status;
            }
        }
    }
})