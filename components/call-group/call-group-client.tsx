"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { usePocCall } from '@/hooks/use-poc-call'

const CallGroupClient = () => {
  const {
    isReady,
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
    handleExitTempGroup,
  } = usePocCall();

  const statusName = (status: number) => {
    switch (status) {
      case 0: return "Rảnh rỗi";
      case 100: return "Đang gọi";
      case 180: return "Đang đổ chuông";
      case 200: return "Đã kết nối";
      default: return `Trạng thái ${status}`;
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Đang tải thư viện giao tiếp...</p>
          <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Trạng thái máy chủ:</span>
            <Badge variant={isOnline ? 'success' : 'destructive'}>{isOnline ? "Đã kết nối" : "Ngoại tuyến"}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {isOnline && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                <span>{isInTempGroup ? `Đang trong nhóm tạm` : 'Danh sách Nhóm'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {isInTempGroup ? (
                <Button onClick={handleExitTempGroup} variant="destructive" className="w-full">Thoát nhóm tạm</Button>
              ) : (
                groups.map(group => (
                  <Button
                    key={group.group_code}
                    variant={currentGroupCode === group.group_code ? 'default' : 'outline'}
                    onClick={() => handleEnterGroup(group.group_code)}
                  >
                    {group.group_name}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Điều khiển Giao tiếp</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <CardHeader><CardTitle>{isInTempGroup ? `Thành viên: ${tempGroupInfo?.group_name}` : `Thành viên trong nhóm`}</CardTitle></CardHeader>
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
                          <Badge variant={member.online ? 'success' : 'outline'}>
                            {member.online ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          {profile && member.ms_code !== profile.ms_code && member.online && callStatus.status === 0 && !isInTempGroup && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleDuplexCall(member.ms_code)}>Gọi trực tiếp</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCreateTempGroupForRow(member)}>Tạo nhóm tạm</Button>
                            </>
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
