// hooks/use-poc-call.ts
'use client'

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { POC_CREDENTIALS } from '@/lib/constants';

// Global type declarations for external scripts
declare global {
  interface Window {
    BePocApi: any;
    PocClient: any;
    PCMPlayer: any;
    PcmRecorder: any;
  }
}

// Type definitions for the hook's return value
export interface PocCallState {
  isReady: boolean;
  isConnected: boolean;
  isOnline: boolean;
  groups: any[];
  members: any[];
  currentGroupCode: string;
  talkingUser: { ms_code: string; ms_name: string; message: string };
  callStatus: { status: number; ms_name: string; is_caller: boolean };
  isInTempGroup: boolean;
  tempGroupInfo: any;
  profile: any;
}

export interface PocCallActions {
  handleStartTalk: () => void;
  handleStopTalk: () => void;
  handleDuplexCall: (msCode: string) => void;
  handleDuplexAnswer: () => void;
  handleDuplexBye: () => void;
  handleEnterGroup: (groupCode: string) => void;
  handleCreateTempGroupForRow: (member: any) => void;
  handleCreateTempGroup: (msCodes: string[]) => void; // New function for multi-member group
  handleExitTempGroup: () => void;
  initiatePrivateTalk: (member: any) => void;
  terminatePrivateTalk: () => void;
}

export const usePocCall = (): PocCallState & PocCallActions => {
  // === REFS ===
  const pocClientRef = useRef<any>(null);
  const wasmApiRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const recorderRef = useRef<any>(null);
  const currentGroupCodeRef = useRef('');
  const profileRef = useRef<any>(null);
  const startTalkAfterTempGroupCreationRef = useRef(false);
  const groupMembersCacheRef = useRef<{ [key: string]: any[] }>({});
  const scriptsLoadedRef = useRef(false);

  // === STATE ===
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentGroupCode, setCurrentGroupCode] = useState('');
  const [talkingUser, setTalkingUser] = useState({ ms_code: '', ms_name: '', message: '' });
  const [callStatus, setCallStatus] = useState({ status: 0, ms_name: '', is_caller: false });
  const [isInTempGroup, setIsInTempGroup] = useState(false);
  const [tempGroupInfo] = useState<any>(null);
  const [profile, setProfileState] = useState<any>(null);
  const [, setGroupMembersCacheState] = useState<{ [key: string]: any[] }>({});

  // === STATE/REF WRAPPERS ===
  const setProfile = (data: any) => {
    setProfileState(data);
    profileRef.current = data;
  };

  const setGroupMembersCache = (updater: (prevCache: { [key: string]: any[] }) => { [key: string]: any[] }) => {
    setGroupMembersCacheState(prevCache => {
      const newCache = updater(prevCache);
      groupMembersCacheRef.current = newCache;
      return newCache;
    });
  };

  // === SCRIPT LOADING & INITIALIZATION ===
  useEffect(() => {
    if (scriptsLoadedRef.current) return;
    scriptsLoadedRef.current = true;

    const loadScript = (url: string) => new Promise<void>((resolve, reject) => {
      // Prevent duplicate script loading in React Strict Mode
      if (document.querySelector(`script[src="${url}"]`)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${url}`));
      document.head.appendChild(script);
    });

    const waitForGlobal = (globalName: string, timeout = 10000) => new Promise<void>((resolve, reject) => {
      if ((window as any)[globalName]) return resolve();
      const startTime = Date.now();
      const interval = setInterval(() => {
        if ((window as any)[globalName]) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for ${globalName}`));
        }
      }, 100);
    });

    const initialize = async () => {
      try {
        await loadScript('/poc-call-lib/bepocapi-es5.js');
        await waitForGlobal('BePocApi');
        await loadScript('/poc-call-lib/PcmPlayer.js');
        await waitForGlobal('PCMPlayer');
        await loadScript('/poc-call-lib/PcmRecorder.js');
        await waitForGlobal('PcmRecorder');
        await loadScript('/poc-call-lib/PocClient.js');
        await waitForGlobal('PocClient');

        const api = await window.BePocApi();
        api._BeCodecInit();
        wasmApiRef.current = api;

        if (!recorderRef.current) {
          recorderRef.current = new window.PcmRecorder(8000);
          recorderRef.current.requestMicrophone();
        }
        setIsReady(true);
      } catch (error) {
        console.error('Lỗi khởi tạo thư viện PoC:', error);
        // toast.error("Lỗi nghiêm trọng khi tải thư viện giao tiếp.");
      }
    };

    initialize();

    return () => {
      if (pocClientRef.current) {
        pocClientRef.current.closePoc();
      }
    };
  }, []);

  // === AUTO-CONNECTION EFFECT ===
  useEffect(() => {
    if (isReady && !isConnected) {
      handleConnect();
    }
  }, [isReady, isConnected]);

  // === EVENT LISTENERS SETUP ===
  const setupEventListeners = (client: any) => {
    if (!playerRef.current) {
      playerRef.current = new window.PCMPlayer({ inputCodec: 'Int16', channels: 1, sampleRate: 8000, flushTime: 320 });
    }
    if (recorderRef.current) {
      recorderRef.current.onFrameData = client.sendFrame.bind(client);
      client.on('startRecord', recorderRef.current.startRecord.bind(recorderRef.current));
      client.on('stopRecord', recorderRef.current.stopRecord.bind(recorderRef.current));
    }

    client.on('onlineStatus', (_: any, data: any) => {
      const online = data.status === 3;
      setIsOnline(online);
    });

    client.on('userProfile', (_: any, data: any) => {
      setProfile(data);
      setCurrentGroupCode(data.group_code);
      currentGroupCodeRef.current = data.group_code;
    });

    client.on('groupList', (_: any, data: any) => setGroups(data.groups));

    client.on('memberList', (_: any, data: any) => {
      setGroupMembersCache(prevCache => ({ ...prevCache, [data.group_code]: data.members }));
      setGroups(prevGroups => prevGroups.map(g => g.group_code === data.group_code ? { ...g, members: data.members } : g));
      if (currentGroupCodeRef.current === data.group_code) {
        setMembers(data.members);
      }
    });

    client.on('msOnline', (_: any, data: any) => {
      setMembers(prev => prev.map(m => m.ms_code === data.ms_code ? { ...m, online: true } : m));
    });

    client.on('msOffline', (_: any, data: any) => {
      setMembers(prev => prev.map(m => m.ms_code === data.ms_code ? { ...m, online: false } : m));
    });

    client.on('enterGroup', (_: any, data: any) => {
      const group = groups.find(g => g.group_code === data.group_code);
      if (group && group.members) setMembers(group.members);
      setCurrentGroupCode(data.group_code);
      currentGroupCodeRef.current = data.group_code;
    });

    client.on('tempGroup', (_: any, data: any) => {
      const isTempGroup = !!data.group_code;
      // setIsInTempGroup(isTempGroup);
      // setTempGroupInfo(isTempGroup ? data : null);
      if (isTempGroup) {
       // setMembers(data.members);
        // If the flag is set, start talking immediately and reset the flag
        if (startTalkAfterTempGroupCreationRef.current) {
          setTimeout(() => {
          handleStartTalk();
          startTalkAfterTempGroupCreationRef.current = false;
          setIsInTempGroup(isTempGroup);
          }, 500);
        }
      }
      //  else {
      //   // Reset flag if we are leaving a temp group for any reason
      //   startTalkAfterTempGroupCreationRef.current = false;
      //   const mainGroupMembers = groupMembersCacheRef.current[profileRef.current?.group_code];
      //   if (mainGroupMembers) setMembers(mainGroupMembers);
      // }
    });

    client.on('startTalk', (_: any, data: any) => {
      setTalkingUser({ ms_code: data.ms_code, ms_name: data.ms_name, message: '' })
    });
    client.on('stopTalk', () => setTalkingUser({ ms_code: '', ms_name: '', message: '' }));
    client.on('talkDenied', (_: any, data: any) => {
      setIsInTempGroup(false)
      setTalkingUser({ ms_code: '', ms_name: '', message: data.message })
    });
    client.on('callStatus', (_: any, data: any) => setCallStatus(data));
    client.on('playFrame', (_: any, data: any) => {
      let view = new DataView(data.buffer);
      let buf = new Int16Array(data.byteLength / 2);
      for (let i = 0; i < data.byteLength / 2; i++) {
        buf[i] = view.getInt16(2 * i, true);
      }
      playerRef.current.feed(buf);
    });
  };

  // === ACTIONS ===
  const handleConnect = () => {
    if (!wasmApiRef.current) return;
    const client = new window.PocClient(wasmApiRef.current);
    pocClientRef.current = client;
    setupEventListeners(client);
    client.setUsername(POC_CREDENTIALS.user);
    client.setPassword(POC_CREDENTIALS.pwd);
    client.setUrl(POC_CREDENTIALS.ws_url);
    client.setTimestamp(Math.floor(Date.now() / 1000).toString());
    client.setToken('any_token');
    client.openPoc();
    setIsConnected(true);
  };

  const handleStartTalk = () => { if (pocClientRef.current) pocClientRef.current.startTalk(); };
  const handleStopTalk = () => { if (pocClientRef.current) pocClientRef.current.stopTalk(); };
  const handleDuplexCall = (msCode: string) => { if (pocClientRef.current) pocClientRef.current.duplexCall(msCode); };
  const handleDuplexAnswer = () => { if (pocClientRef.current) pocClientRef.current.duplexAnswer(200); };
  const handleDuplexBye = () => { if (pocClientRef.current) pocClientRef.current.duplexBye(); };
  const handleEnterGroup = (groupCode: string) => {
    if (pocClientRef.current) {
      pocClientRef.current.switchGroup(groupCode);
      setCurrentGroupCode(groupCode);
      currentGroupCodeRef.current = groupCode;
    }
  };
  const handleCreateTempGroupForRow = (member: any) => {
    if (pocClientRef.current && member.ms_code) {
      pocClientRef.current.createTempGroup([member.ms_code]);
    } else {
      toast.error("Thiết bị không hợp lệ hoặc thiếu mã MS.");
    }
  };

  const handleCreateTempGroup = (msCodes: string[]) => {
    if (pocClientRef.current && msCodes.length > 0) {
      pocClientRef.current.createTempGroup(msCodes);
    } else {
      toast.warning("Không có thiết bị nào đang online để tạo nhóm.");
    }
  };

  const handleExitTempGroup = () => { 
    console.log('quitTempGroup');
    if (pocClientRef.current){
      pocClientRef.current.quitTempGroup();
    } 
  };

  const initiatePrivateTalk = (member: any) => {
    console.log('createTempGroup', member)
    if (pocClientRef.current && member.ms_code) {
      startTalkAfterTempGroupCreationRef.current = true;
      pocClientRef.current.createTempGroup([member.ms_code]);
    } else {
      toast.error("Thiết bị không hợp lệ hoặc thiếu mã MS.");
    }
  };

  const terminatePrivateTalk = () => {
    if (pocClientRef.current) {
      console.log('hehehe');
      
      handleStopTalk();
      pocClientRef.current.quitTempGroup();
      setIsInTempGroup(false)
    }
  };

  return {
    isReady,
    isConnected,
    isOnline,
    groups,
    members,
    currentGroupCode,
    talkingUser,
    callStatus,
    isInTempGroup,
    tempGroupInfo,
    profile,
    handleStartTalk,
    handleStopTalk,
    handleDuplexCall,
    handleDuplexAnswer,
    handleDuplexBye,
    handleEnterGroup,
    handleCreateTempGroupForRow,
    handleCreateTempGroup,
    handleExitTempGroup,
    initiatePrivateTalk,
    terminatePrivateTalk,
  };
};
