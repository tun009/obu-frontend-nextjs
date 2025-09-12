"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Khai báo các kiểu dữ liệu toàn cục từ các script bên ngoài để TypeScript không báo lỗi
declare global {
  interface Window {
    BePocApi: any;
    PocClient: any;
    PCMPlayer: any;
    PcmRecorder: any;
  }
}

const CallGroupClient = () => {
const statusName = (status: number) => {
  switch (status) {
    case 0: return "Rảnh rỗi";
    case 100: return "Đang gọi";
    case 180: return "Đang đổ chuông";
    case 200: return "Đã kết nối";
    default: return `Trạng thái ${status}`;
  }
};

  // === TRẠNG THÁI (STATE) ===
  const pocClientRef = useRef<any>(null);
  const wasmApiRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const recorderRef = useRef<any>(null);
  const currentGroupCodeRef = useRef(''); // Ref để tránh stale state
  const scriptsLoadedRef = useRef(false); // Guard for useEffect

  const [isReady, setIsReady] = useState(false);
  const [account, setAccount] = useState({ ws_url: 'wss://34.124.183.8/v1/ws/client', user: '25075738107', pwd: '123456' });
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentGroupCode, setCurrentGroupCode] = useState('');
  const [talkingUser, setTalkingUser] = useState({ ms_code: '', ms_name: '', message: '' });
  const [callStatus, setCallStatus] = useState({ status: 0, ms_name: '', is_caller: false });
  const [profile, setProfile] = useState<any>(null); // Bổ sung state cho user profile

  useEffect(() => {
    // Guard to prevent this from running twice in React Strict Mode
    if (scriptsLoadedRef.current) return;
    scriptsLoadedRef.current = true;

    const loadScript = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false; // This is crucial for sequential execution
        script.onload = () => {
          console.log(`Script loaded: ${url}`);
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load script ${url}`));
        document.head.appendChild(script);
      });
    };

    const waitForGlobal = (globalName: string, timeout = 10000) => {
      return new Promise<void>((resolve, reject) => {
        // Check immediately first
        if ((window as any)[globalName]) {
          console.log(`Global ${globalName} is already available`);
          resolve();
          return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if ((window as any)[globalName]) {
            clearInterval(checkInterval);
            console.log(`Global ${globalName} is now available`);
            resolve();
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.error(`Timeout waiting for ${globalName}. Available globals:`, Object.keys(window).filter(k => k.includes('Poc') || k.includes('PCM')));
            reject(new Error(`Timeout waiting for ${globalName}`));
          }
        }, 100);
      });
    };

    const initialize = async () => {
      try {
        console.log('Bắt đầu tải các thư viện...');

        // Load BePocApi first
        console.log('Đang tải BePocApi...');
        await loadScript('/poc-call-lib/bepocapi-es5.js');
        await waitForGlobal('BePocApi');

        // Load PCMPlayer
        console.log('Đang tải PCMPlayer...');
        await loadScript('/poc-call-lib/PcmPlayer.js');
        await waitForGlobal('PCMPlayer');

        // Load PcmRecorder
        console.log('Đang tải PcmRecorder...');
        await loadScript('/poc-call-lib/PcmRecorder.js');
        await waitForGlobal('PcmRecorder');

        // Load PocClient last
        console.log('Đang tải PocClient...');
        await loadScript('/poc-call-lib/PocClient.js');
        await waitForGlobal('PocClient');

        // Verify all modules are loaded
        console.log('Kiểm tra các module đã tải:');
        console.log('✓ BePocApi:', typeof window.BePocApi);
        console.log('✓ PCMPlayer:', typeof window.PCMPlayer);
        console.log('✓ PcmRecorder:', typeof window.PcmRecorder);
        console.log('✓ PocClient:', typeof window.PocClient);

        // Validate that all required modules are available
        if (!window.BePocApi || !window.PCMPlayer || !window.PcmRecorder || !window.PocClient) {
          throw new Error('Một hoặc nhiều module không được tải thành công');
        }

        // Now that all scripts are loaded, we can initialize the WASM module
        console.log('Khởi tạo WASM module...');
        const api = await window.BePocApi();
        api._BeCodecInit();
        wasmApiRef.current = api;

        console.log('Tất cả thư viện đã sẵn sàng!');
        toast.success("Hệ thống giao tiếp đã sẵn sàng!");
        setIsReady(true);
      } catch (error) {
        console.error('Lỗi khởi tạo:', error);
        toast.error("Lỗi nghiêm trọng khi tải thư viện giao tiếp: " + (error as Error).message);
      }
    };

    initialize();

    // Cleanup function
    return () => {
      if (pocClientRef.current) {
        console.log("Đóng kết nối PoC...");
        pocClientRef.current.closePoc();
      }
    };
  }, []);

  // === CÁC HÀM XỬ LÝ SỰ KIỆN ===
  const handleConnect = () => {
    if (!wasmApiRef.current) {
      toast.error("Lõi giao tiếp chưa sẵn sàng.");
      return;
    }

    const client = new window.PocClient(wasmApiRef.current);
    pocClientRef.current = client;

    // Thiết lập các trình xử lý sự kiện từ server
    setupEventListeners(client);

    client.setUsername(account.user);
    client.setPassword(account.pwd);
    client.setUrl(account.ws_url);
    client.setTimestamp(Math.floor(Date.now() / 1000).toString());
    client.setToken('any_token'); // Sử dụng token giống như trong demo
    client.openPoc();
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    if (pocClientRef.current) {
      pocClientRef.current.closePoc();
      // Reset trạng thái
      setIsConnected(false);
      setIsOnline(false);
      setGroups([]);
      setMembers([]);
    }
  };

  const handleStartTalk = () => {
    if (pocClientRef.current) pocClientRef.current.startTalk();
  };

  const handleStopTalk = () => {
    if (pocClientRef.current) pocClientRef.current.stopTalk();
  };

  const handleDuplexCall = (msCode: string) => {
    if (pocClientRef.current) {
      pocClientRef.current.duplexCall(msCode);
    }
  };

  const handleDuplexAnswer = () => {
    if (pocClientRef.current) {
      pocClientRef.current.duplexAnswer(200);
    }
  };

  const handleDuplexBye = () => {
    if (pocClientRef.current) {
      pocClientRef.current.duplexBye();
    }
  };

  const handleEnterGroup = (groupCode: string) => {
    if (pocClientRef.current) {
      pocClientRef.current.switchGroup(groupCode);
      setCurrentGroupCode(groupCode);
      currentGroupCodeRef.current = groupCode; // Cập nhật ref
    }
  };

  // === THIẾT LẬP EVENT LISTENERS ===
  const setupEventListeners = (client: any) => {
    if (!playerRef.current) {
      playerRef.current = new window.PCMPlayer({ inputCodec: 'Int16', channels: 1, sampleRate: 8000, flushTime: 320 });
    }
    if (!recorderRef.current) {
      recorderRef.current = new window.PcmRecorder(8000);
      recorderRef.current.requestMicrophone();
      recorderRef.current.onFrameData = client.sendFrame.bind(client);
      client.on('startRecord', recorderRef.current.startRecord.bind(recorderRef.current));
      client.on('stopRecord', recorderRef.current.stopRecord.bind(recorderRef.current));
    }

    client.on('onlineStatus', (_: any, data: any) => {
      const online = data.status === 3;
      setIsOnline(online);
      if (online) toast.success("Đã kết nối và xác thực thành công!");
    });

    client.on('userProfile', (_: any, data: any) => {
      setProfile(data);
      setCurrentGroupCode(data.group_code);
      currentGroupCodeRef.current = data.group_code; // Cập nhật ref ngay từ đầu
    });

    client.on('groupList', (_: any, data: any) => setGroups(data.groups));

    client.on('memberList', (_: any, data: any) => {
      setGroups(prev => prev.map(g => g.group_code === data.group_code ? { ...g, members: data.members } : g));
      // Luôn đọc giá trị mới nhất từ ref để tránh stale state
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
    });

    client.on('startTalk', (_: any, data: any) => setTalkingUser({ ms_code: data.ms_code, ms_name: data.ms_name, message: '' }));
    client.on('stopTalk', () => setTalkingUser({ ms_code: '', ms_name: '', message: '' }));
    client.on('talkDenied', (_: any, data: any) => {
      toast.error(`Yêu cầu nói bị từ chối: ${data.message}`);
      setTalkingUser({ ms_code: '', ms_name: '', message: data.message });
    });

    client.on('callStatus', (_: any, data: any) => {
        setCallStatus(data);
    });

    client.on('playFrame', (_: any, data: any) => {
      let view = new DataView(data.buffer);
      let buf = new Int16Array(data.byteLength / 2);
      for (let i = 0; i < data.byteLength / 2; i++) {
        buf[i] = view.getInt16(2 * i, true);
      }
      playerRef.current.feed(buf);
    });
  };

  // === RENDER GIAO DIỆN ===
  return (
    <div className="space-y-4">
      {/* Phần kết nối */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Trạng thái máy chủ:</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>{isOnline ? "Đã kết nối" : "Ngoại tuyến"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ Server (WSS)</label>
            <Input
              value={account.ws_url}
              onChange={e => setAccount(p => ({ ...p, ws_url: e.target.value }))}
              placeholder="wss://your.server/v1/ws/client"
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tài khoản</label>
            <Input
              value={account.user}
              onChange={e => setAccount(p => ({ ...p, user: e.target.value }))}
              disabled={isConnected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <Input
              type="password"
              value={account.pwd}
              onChange={e => setAccount(p => ({ ...p, pwd: e.target.value }))}
              disabled={isConnected}
            />
          </div>
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              className="md:col-span-3"
              disabled={!isReady}
            >
              {isReady ? 'Kết nối' : 'Đang tải thư viện...'}
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="destructive" className="md:col-span-3">Ngắt kết nối</Button>
          )}
        </CardContent>
      </Card>

      {/* Phần chức năng */}
      {isOnline && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Danh sách Nhóm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {groups.map(group => (
                <Button
                  key={group.group_code}
                  variant={currentGroupCode === group.group_code ? 'default' : 'outline'}
                  onClick={() => handleEnterGroup(group.group_code)}
                >
                  {group.group_name}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Điều khiển Giao tiếp</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PTT Control */}
                <div className="space-y-3">
                    <h4 className="font-semibold">Push-to-Talk (Nhóm)</h4>
                    <div className="flex gap-2">
                        <Button onClick={handleStartTalk} disabled={!!talkingUser.ms_code || callStatus.status !== 0}>Bắt đầu nói</Button>
                        <Button onClick={handleStopTalk} disabled={!profile || talkingUser.ms_code !== profile.ms_code}>Dừng nói</Button>
                    </div>
                    {talkingUser.ms_code && (
                        <Badge variant="secondary">
                            {!profile || talkingUser.ms_code === profile.ms_code ? "Bạn đang nói..." : `${talkingUser.ms_name} đang nói...`}
                        </Badge>
                    )}
                </div>
                {/* Duplex Call Control */}
                <div className="space-y-3">
                    <h4 className="font-semibold">Cuộc gọi trực tiếp</h4>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleDuplexAnswer}
                            disabled={callStatus.status !== 180 || callStatus.is_caller}
                            variant={callStatus.status === 180 && !callStatus.is_caller ? 'destructive' : 'outline'}
                        >
                            Trả lời
                        </Button>
                        <Button
                            onClick={handleDuplexBye}
                            disabled={callStatus.status === 0}
                            variant="outline"
                        >
                            Gác máy
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Trạng thái: <span className="font-semibold text-primary">{statusName(callStatus.status)}</span>
                        {callStatus.status !== 0 && (
                            <span> - {callStatus.ms_name}</span>
                        )}
                    </div>
                </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Card>
                <CardHeader><CardTitle>Thành viên trong nhóm</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã người dùng</TableHead>
                                <TableHead>Tên người dùng</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
                                <TableRow key={member.ms_code}>
                                    <TableCell>{member.ms_code}</TableCell>
                                    <TableCell>{member.ms_name}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.online ? 'default' : 'outline'}>
                                            {member.online ? 'Online' : 'Offline'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {profile && member.ms_code !== profile.ms_code && member.online && callStatus.status === 0 && (
                                            <Button size="sm" variant="outline" onClick={() => handleDuplexCall(member.ms_code)}>Gọi trực tiếp</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default CallGroupClient;

