"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { usePocCall } from '@/hooks/use-poc-call'
import { useTranslation } from 'react-i18next'

const CallGroupClient = () => {
  const { t } = useTranslation();
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
    handleExitTempGroup,
  } = usePocCall();

  const statusName = (status: number) => {
    switch (status) {
      case 0: return t("callGroup.status.idle");
      case 100: return t("callGroup.status.calling");
      case 180: return t("callGroup.status.ringing");
      case 200: return t("callGroup.status.connected");
      default: return t("callGroup.status.unknown", { status });
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">{t('callGroup.loadingLibrary')}</p>
          <p className="text-sm text-muted-foreground">{t('callGroup.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{t('callGroup.serverStatus')}</span>
            <Badge variant={isOnline ? 'success' : 'destructive'}>{isOnline ? t('callGroup.connectedToServer') : t('callGroup.offline')}</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {isOnline && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                <span>{isInTempGroup ? t('callGroup.inTempGroup') : t('callGroup.groupList')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {isInTempGroup ? (
                <Button onClick={handleExitTempGroup} variant="destructive" className="w-full">{t('callGroup.exitTempGroup')}</Button>
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
              <CardTitle>{t('callGroup.communicationControls')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">{t('callGroup.pttGroup')}</h4>
                <div className="flex gap-2">
                  <Button onClick={handleStartTalk} disabled={!!talkingUser.ms_code || callStatus.status !== 0}>{t('callGroup.startTalk')}</Button>
                  <Button onClick={handleStopTalk} disabled={!profile || talkingUser.ms_code !== profile.ms_code}>{t('callGroup.stopTalk')}</Button>
                </div>
                {talkingUser.ms_code && (
                  <Badge variant="secondary">
                    {!profile || talkingUser.ms_code === profile.ms_code ? t('callGroup.youAreTalking') : t('callGroup.userIsTalking', { name: talkingUser.ms_name })}
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">{t('callGroup.directCall')}</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDuplexAnswer}
                    disabled={callStatus.status !== 180 || callStatus.is_caller}
                    variant={callStatus.status === 180 && !callStatus.is_caller ? 'destructive' : 'outline'}
                  >
                    {t('callGroup.answer')}
                  </Button>
                  <Button
                    onClick={handleDuplexBye}
                    disabled={callStatus.status === 0}
                    variant="outline"
                  >
                    {t('callGroup.hangUp')}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('callGroup.callState')} <span className="font-semibold text-primary">{statusName(callStatus.status)}</span>
                  {callStatus.status !== 0 && (
                    <span> - {callStatus.ms_name}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader><CardTitle>{isInTempGroup ? t('callGroup.membersOfTempGroup', { groupName: tempGroupInfo?.group_name }) : t('callGroup.membersOfGroup')}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('callGroup.table.userId')}</TableHead>
                      <TableHead>{t('callGroup.table.userName')}</TableHead>
                      <TableHead>{t('callGroup.table.status')}</TableHead>
                      <TableHead>{t('callGroup.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.ms_code}>
                        <TableCell>{member.ms_code}</TableCell>
                        <TableCell>{member.ms_name}</TableCell>
                        <TableCell>
                          <Badge variant={member.online ? 'success' : 'outline'}>
                            {member.online ? t('callGroup.memberStatus.online') : t('callGroup.memberStatus.offline')}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          {profile && member.ms_code !== profile.ms_code && member.online && callStatus.status === 0 && !isInTempGroup && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleDuplexCall(member.ms_code)}>{t('callGroup.directCallButton')}</Button>

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
