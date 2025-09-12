class PocClient {
    constructor(module) {
        this.module = module
        this.ms_code = ""
        this.ms_name = ""
        this.group_code = ""
        this.group_name = ""
        this.temp_group = {}
        this.__url = ""
        this.__timestamp = ""
        this.__username = ""
        this.__password = ""
        this.__token = ""
        this.onlineStatus = 0
        this.online = false
        this.ready = false
        this.rec_buf_ptr = 0
        this.__open_issued = 0
        this._events = {}

        this.init(module)
    }

    init(module) {
        this.module = module
        this.module._BeCodecInit()

        this.rec_buf_ptr = this.module._malloc(640)

        this.client = this.module._poc_get_client()

        let ptr = this.module.addFunction(this.handleEvent.bind(this), "vi")
        this.module._poc_set_event_callback(this.client, ptr)

        // this.enableBuiltinSink()
        this.enablePlayRing(true)
        this.enablePlayTone(false)

        ptr = this.module.addFunction(this.playFrame.bind(this), "vii")
        this.module._poc_set_play_callback(this.client, ptr)


        this.ready = true
        this.setLogLevel(0)
        this.__try_connect()
    }

    __on(event, callback, once) {
        let callbacks = this._events[event] || []
        callbacks.push({
            callback: callback, once: once,
        })
        this._events[event] = callbacks
    }

    on(event, callback) {
        this.__on(event, callback, false)
    }

    once(event, callback) {
        this.__on(event, callback, true)
    }

    off(event) {
        delete this._events[event]
    }

    emit(event, data) {
        let callbacks = this._events[event]
        if (!callbacks || callbacks.length === 0) return

        this._events[event] = callbacks.filter(entry => {
            entry.callback(event, data)
            return !entry.once
        })
    }

    playFrame(ptr, length) {
        const buf = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
            buf[i] = this.module.HEAPU8[ptr + i]
        }

        this.emit('playFrame', buf)
    }

    handleEvent(json) {
        const str = this.module.UTF8ToString(json)
        const event = JSON.parse(str)
        if (event.event === "onlineStatus") {
            this.onlineStatus = event.data.status
            this.online = (event.data.status === 3)
        } else if (event.event === "userProfile") {
            this.ms_code = event.data.ms_code
            this.ms_name = event.data.ms_name
            this.group_code = event.data.group_code
            this.group_name = event.data.group_name
        } else if (event.event === "tempGroup") {
            this.temp_group = event.data
        }
        this.emit(event.event, event.data)
    }

    sendFrame(buffer) {
        const bytes = new Uint8Array(buffer)
        this.module.HEAP8.set(bytes, this.rec_buf_ptr)

        this.module._poc_send_frame(this.client, this.rec_buf_ptr, buffer.byteLength)
    }

    setLogLevel(level) {
        this.module._poc_set_loglevel(this.client, level)
    }

    openPoc() {
        this.__open_issued = true
        this.__try_connect()
    }

    closePoc() {
        this.__open_issued = false;
        this.module._poc_close(this.client)
    }

    setUrl(url) {
        if (this.__url === url) return

        const fields = url.split('/')
        const http_url = {
            'wss:': 'https:',
            'ws:': 'http:',
        }[fields[0]] + "//" + fields[2] + "/v1/customer/checklogin";
        fetch(http_url).then(r => r)

        this.__url = url
        this.__try_connect()
    }

    setSampleRate(sample_rate) {
        this.module._poc_set_sample_rate(this.client, sample_rate)
    }

    setUsername(username) {
        if (this.__username === username) return
        this.__username = username
        this.__try_connect()
    }

    setPassword(password) {
        if (this.__password === password) return
        this.__password = password
        this.__try_connect()
    }

    setTimestamp(timestamp) {
        if (this.__timestamp === timestamp) return
        this.__timestamp = timestamp
        this.__try_connect()
    }

    setToken(token) {
        if (this.__token === token) return
        this.__token = token
        this.__try_connect()
    }

    __try_connect() {
        if (this.ready && this.__open_issued
            && this.__timestamp && this.__url && this.__username && this.__password) {
            this.__set_url(this.__url)
            this.__set_username(this.__username)
            this.__set_timestamp(this.__timestamp)
            this.__set_password(this.__password)
            this.__set_token(this.__token);
            this.__open()
            console.info("real open poc")
        } else {
            console.warn("parameter not complete", this)
        }
    }

    __set_url(url) {
        const ptr = this.module.allocateUTF8(url)
        this.module._poc_set_url(this.client, ptr)
        this.module._free(ptr)
    }

    __set_timestamp(timestamp) {
        const ptr = this.module.allocateUTF8(timestamp)
        this.module._poc_set_timestamp(this.client, ptr)
        this.module._free(ptr)
    }

    __set_username(username) {
        this.ms_code = username

        const ptr = this.module.allocateUTF8(username)
        this.module._poc_set_username(this.client, ptr)
        this.module._free(ptr)
    }

    __set_password(password) {
        const ptr = this.module.allocateUTF8(password)
        this.module._poc_set_password(this.client, ptr)
        this.module._free(ptr)
    }

    __set_token(token) {
        const ptr = this.module.allocateUTF8(token)
        this.module._poc_set_token(this.client, ptr)
        this.module._free(ptr)
    }


    __open() {
        console.info("poc_open")
        this.module._poc_open(this.client)
    }

    startTalk() {
        this.module._poc_start_talk(this.client)
    }


    startTalkEx(ids) {
        if (!Array.isArray(ids)) {
            console.error('parameter is not array')
            return;
        }

        const nonString = ids.filter(id => typeof (id) !== 'string')
        if (nonString.length > 0) {
            console.error('parameter contains non-string')
            return;
        }

        const str_pointers = ids.map(id => this.module.allocateUTF8(id))
        const arr = this.module._malloc(4 * str_pointers.length)
        for (let i = 0; i < str_pointers.length; i++) {
            this.module.setValue(arr + i * 4, str_pointers[i], 'i32')
        }

        this.module._poc_start_talk_ex(this.client, arr, str_pointers.length)
        this.module._free(arr)
        str_pointers.map(ptr => this.module._free(ptr))
    }

    stopTalk() {
        this.module._poc_stop_talk(this.client)
    }

    switchGroup(group_code) {
        const ptr = this.module.allocateUTF8(group_code)
        this.module._poc_switch_group(this.client, ptr)
        this.module._free(ptr)
    }

    createTempGroup(ids) {
        if (!Array.isArray(ids)) {
            console.error('parameter is not array')
            return;
        }
        debugger
        const nonString = ids.filter(id => typeof (id) !== 'string')
        if (nonString.length > 0) {
            console.error('parameter contains non-string')
            return;
        }

        const str_pointers = ids.map(id => this.module.allocateUTF8(id))
        const arr = this.module._malloc(4 * str_pointers.length)
        for (let i = 0; i < str_pointers.length; i++) {
            this.module.setValue(arr + i * 4, str_pointers[i], 'i32')
        }

        this.module._poc_create_temp_group(this.client, arr, str_pointers.length)
        this.module._free(arr)
        str_pointers.map(ptr => this.module._free(ptr))
    }

    duplexCall(callee, options) {
        const json_str_options = options ? JSON.stringify(options) : '{}';
        const ptr = this.module.allocateUTF8(callee)
        const option_ptr = this.module.allocateUTF8(json_str_options)

        this.module._poc_duplex_call_ex(this.client, ptr, option_ptr)
        this.module._free(ptr)
        this.module._free(option_ptr)
    }

    sendSms(to, contents) {
        const to_ptr = this.module.allocateUTF8(to)
        const contents_ptr = this.module.allocateUTF8(contents)
        this.module._poc_send_sms(this.client, to_ptr, contents_ptr)
        this.module._free(to_ptr)
        this.module._free(contents_ptr)
    }

    duplexBye() {
        this.module._poc_duplex_bye(this.client)
    }

    duplexAnswer(code) {
        this.module._poc_duplex_answer(this.client, code)
    }

    quitTempGroup() {
        this.module._poc_quit_temp_group(this.client)
    }

    mute() {
        return this.module._poc_get_mute(this.client)
    }

    getMuteSpk() {
        return this.module._poc_get_spk_mute(this.client)
    }

    setMute(value) {
        return this.module._poc_set_mute(this.client, value)
    }

    muteSpk(value) {
        return this.module._poc_mute_spk(this.client, value)
    }

    postRebootCommand(to_ms_code, timeout) {
        const ptr = this.module.allocateUTF8(to_ms_code)
        this.module._poc_post_reboot_command(this.client, ptr, timeout)
        this.module._free(ptr)
    }

    postQuitCommand(to_ms_code, timeout) {
        const ptr = this.module.allocateUTF8(to_ms_code)
        this.module._poc_post_quit_command(this.client, ptr, timeout)
        this.module._free(ptr)
    }

    postPlayLocal(to_ms_code, local_file_id, timeout) {
        const ptr = this.module.allocateUTF8(to_ms_code)
        this.module._poc_post_play_local(this.client, ptr, local_file_id, timeout)
        this.module._free(ptr)
    }

    postSaveLocal(to_ms_code, local_file_id, file_name, contents, timeout) {
        const ms_code_ptr = this.module.allocateUTF8(to_ms_code)
        const file_name_ptr = this.module.allocateUTF8(file_name)


        const contents_ptr = this.module._malloc(contents.byteLength)
        var data = new DataView(contents);

        for (let i = 0; i < contents.byteLength; i++) {
            this.module.setValue(contents_ptr + i, data.getInt8(i), 'i8')
        }

        this.module.HEAP8.set(contents, contents_ptr)

        this.module._poc_post_save_local(this.client, ms_code_ptr, local_file_id, file_name_ptr,
            contents_ptr, contents.byteLength,
            timeout)
        this.module._free(ms_code_ptr)
        this.module._free(file_name_ptr)
        this.module._free(contents_ptr)
    }

    postSetAoVolume(to_ms_code, volume, timeout) {
        const ms_code_ptr = this.module.allocateUTF8(to_ms_code)
        this.module._poc_post_set_ao_volume(this.client, ms_code_ptr, volume, timeout)
        this.module._free(ms_code_ptr)
    }

    postSetAiVolume(to_ms_code, volume, timeout) {
        const ms_code_ptr = this.module.allocateUTF8(to_ms_code)
        this.module._poc_post_set_ai_volume(this.client, ms_code_ptr, volume, timeout)
        this.module._free(ms_code_ptr)
    }

    enableBuiltinSink() {
        this.module._poc_enable_builtin_sink(this.client)
    }

    enablePlayTone(enable) {
        this.module._poc_enable_play_tone(this.client, enable)
    }

    enablePlayRing(enable) {
        this.module._poc_enable_play_ring(this.client, enable)
    }
}

// Export to global scope
window.PocClient = PocClient;
