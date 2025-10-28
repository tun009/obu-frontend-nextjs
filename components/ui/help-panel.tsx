"use client"

import { useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Car, User, HardDrive, Calendar, Radio, Phone, LayoutGrid, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageZoom } from "@/components/ui/image-zoom"
import Image from "next/image"
import { cn } from "@/lib/utils"


interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpContent = ({ onImageZoomChange }: { onImageZoomChange: (zoomed: boolean) => void }) => {
  const { t } = useTranslation()

  return (
    <Accordion type="single" collapsible className="w-full">
      {/* System Overview */}
      <AccordionItem value="overview">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            <span className="font-semibold text-base">{t('helpPanel.overview.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.overview.description')}</p>
          <h4>{t('helpPanel.overview.workflowTitle')}</h4>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>{t('helpPanel.overview.step1Title')}</strong>
              <p className="!mt-1">{t('helpPanel.overview.step1Description')}</p>
            </li>
            <li>
              <strong>{t('helpPanel.overview.step2Title')}</strong>
              <p className="!mt-1">{t('helpPanel.overview.step2Description')}</p>
            </li>
            <li>
              <strong>{t('helpPanel.overview.step3Title')}</strong>
              <p className="!mt-1">{t('helpPanel.overview.step3Description')}</p>
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>

      {/* Vehicle Management */}
      <AccordionItem value="vehicle">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-base">{t('helpPanel.vehicle.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.vehicle.description')}</p>
          <h4>{t('helpPanel.vehicle.featuresTitle')}</h4>
          <ul>
            <li><Trans i18nKey="helpPanel.vehicle.featureAdd" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.vehicle.featureUpdate" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.vehicle.featureDelete" components={{ strong: <strong /> }} /></li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Driver Management */}
      <AccordionItem value="driver">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-base">{t('helpPanel.driver.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.driver.description')}</p>
          <h4>{t('helpPanel.driver.featuresTitle')}</h4>
          <ul>
            <li><Trans i18nKey="helpPanel.driver.featureAdd" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.driver.featureUpdate" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.driver.featureDeactivate" components={{ strong: <strong /> }} /></li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Device Management */}
      <AccordionItem value="device">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-base">{t('helpPanel.device.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.device.description')}</p>
          <h4>{t('helpPanel.device.featuresTitle')}</h4>
          <ul>
            <li><Trans i18nKey="helpPanel.device.featureAdd" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.device.featureUpdate" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.device.featureDelete" components={{ strong: <strong /> }} /></li>
            <li><Trans i18nKey="helpPanel.device.featureAssign" components={{ strong: <strong /> }} /></li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Shift Management */}
      <AccordionItem value="shift">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-base">{t('helpPanel.shift.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.shift.description')}</p>
          <ol className="list-decimal list-inside space-y-4">
            <li>
              <strong>{t('helpPanel.shift.listTitle')}</strong>
              <p className="!mt-1">{t('helpPanel.shift.listDescription')}</p>
              <ul className="list-disc list-inside space-y-3 pl-4 !mt-2">
                <li>
                  <strong>{t('helpPanel.shift.createTitle')}</strong>
                  <p className="!mt-1">{t('helpPanel.shift.createDescription')}</p>
                  <ul className="list-['-_'] list-inside space-y-1 pl-4 !mt-1">
                    <li><Trans i18nKey="helpPanel.shift.itemVehicleDriver" components={{ strong: <strong /> }} /></li>
                    <li><Trans i18nKey="helpPanel.shift.itemTime" components={{ strong: <strong /> }} /></li>
                    <li><Trans i18nKey="helpPanel.shift.itemNotes" components={{ strong: <strong /> }} /></li>
                  </ul>
                </li>
                <li>
                  <strong>{t('helpPanel.shift.statusTitle')}</strong>
                  <ul className="list-['-_'] list-inside space-y-1 pl-4 !mt-1">
                    <li><Trans i18nKey="helpPanel.shift.statusPending" components={{ strong: <strong /> }} /></li>
                    <li>
                      <Trans i18nKey="helpPanel.shift.statusActive" components={{ strong: <strong /> }} />
                      <div className="prose prose-sm max-w-none my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="!mt-0 !mb-2 font-semibold text-amber-800">{t('helpPanel.shift.statusActiveNoteTitle')}</p>
                        <p className="!m-0"><Trans i18nKey="helpPanel.shift.statusActiveNoteContent" components={{ strong: <strong /> }} /></p>
                        <ImageZoom
                          onZoomChange={onImageZoomChange}
                          backdropClassName={cn(
                          '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                        )}>
                          <Image
                            src="/images/stream.png"
                            alt="Live"
                            className="mx-auto my-2 rounded-md border w-[100px]"
                            width={100}
                            height={100}
                            unoptimized
                          />
                        </ImageZoom>
                      </div>
                    </li>
                    <li><Trans i18nKey="helpPanel.shift.statusCompleted" components={{ strong: <strong /> }} /></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              <strong>{t('helpPanel.shift.playbackTitle')}</strong>
              <p className="!mt-1">{t('helpPanel.shift.playbackDescription')}</p>
              <ul className="list-disc list-inside space-y-2 pl-4 !mt-2">
                <li>
                  <strong>{t('helpPanel.shift.playbackFeatureSync')}</strong>
                </li>
                <li>
                  <strong>{t('helpPanel.shift.playbackFeatureSlider')}</strong>
                </li>
                <li>
                  <strong>{t('helpPanel.shift.playbackFeatureSpeed')}</strong>
                </li>
                <li>
                  <strong>{t('helpPanel.shift.playbackFeatureMap')}</strong>
                </li>
              </ul>
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>

      {/* Live Module */}
      <AccordionItem value="live">
        <AccordionTrigger>
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-base">{t('helpPanel.live.title')}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
          <p>{t('helpPanel.live.description')}</p>

          <h4>{t('helpPanel.live.featuresTitle')}</h4>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>{t('helpPanel.live.featureGps')}</strong>
              <ul className="list-disc list-inside pl-4 !mt-1">
                <li>{t('helpPanel.live.featureGpsItem1')}</li>
                <li>{t('helpPanel.live.featureGpsItem2')}</li>
              </ul>
            </li>
            <li>
              <strong>{t('helpPanel.live.featureStream')}</strong>
              <ul className="list-disc list-inside pl-4 !mt-1">
                <li>{t('helpPanel.live.featureStreamItem1')}</li>
                <li>{t('helpPanel.live.featureStreamItem2')}</li>
              </ul>
            </li>
            <li>
              <strong>{t('helpPanel.live.featureAudio')}</strong>
              <div className="prose prose-sm max-w-none my-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="!mt-0 !mb-2 font-semibold text-blue-800">{t('helpPanel.live.featureAudioNoteTitle')}</p>
                <p className="!m-0"><Trans i18nKey="helpPanel.live.featureAudioNoteContent" components={{ strong: <strong /> }} /></p>
                <ImageZoom
                  onZoomChange={onImageZoomChange}
                  backdropClassName={cn(
                    '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                  )}>
                  <Image
                    src="/images/group.png"
                    alt={t('helpPanel.live.featureAudioNoteContent')}
                    className="mx-auto my-2 rounded-md border w-[50px]"
                    width={50}
                    height={50}
                    unoptimized
                  />
                </ImageZoom>
              </div>
              <p className="!mt-4">{t('helpPanel.live.featureAudioDescription')}</p>
              <ul className="list-disc list-inside pl-4 !mt-1 space-y-2">
                <li>
                  <Trans i18nKey="helpPanel.live.featureAudioPrivate" components={{ strong: <strong />, Phone: <Phone className="inline h-4 w-4 text-blue-500" /> }} />
                </li>
                <li>
                  {t('helpPanel.live.featureAudioGroup')}
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 mx-1 h-6 text-xs">
                    <Mic className="h-3 w-3 mr-1" />
                    {t('helpPanel.live.featureAudioGroupTalk')}
                  </Button>
                  {t('and')}
                  <Button size="sm" variant="destructive" className="mx-1 h-6 text-xs">
                    <MicOff className="h-3 w-3 mr-1" />
                    {t('helpPanel.live.featureAudioGroupStop')}
                  </Button>
                  {t('helpPanel.live.featureAudioGroupEnd')}
                </li>
              </ul>
              <div className="prose prose-sm max-w-none my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="!mt-0 !mb-2 font-semibold text-amber-800">{t('helpPanel.live.featureAudioDeviceNoteTitle')}</p>
                <p className="!m-0"><Trans i18nKey="helpPanel.live.featureAudioDeviceNoteContent" components={{ strong: <strong /> }} /></p>
                <ImageZoom
                  onZoomChange={onImageZoomChange}
                  backdropClassName={cn(
                  '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                )}>
                  <Image
                    src="/images/mic.png"
                    alt={t('helpPanel.live.featureAudioDeviceNoteContent')}
                    className="mx-auto my-2 rounded-md border w-[50px]"
                    width={50}
                    height={50}
                    unoptimized
                  />
                </ImageZoom>
              </div>
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
)}
export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  const { t } = useTranslation()
  const [isImageZoomed, setIsImageZoomed] = useState(false)

  const handleImageZoomChange = (zoomed: boolean) => {
    setIsImageZoomed(zoomed)
  }

  const handleInteractOutside = (event: Event) => {
    if (isImageZoomed) {
      event.preventDefault()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-2xl w-full overflow-y-auto"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <HelpCircle className="h-7 w-7" />
            <span>{t('helpPanel.title')}</span>
          </SheetTitle>
          <SheetDescription>
            {t('helpPanel.description')}
          </SheetDescription>
        </SheetHeader>
        <HelpContent onImageZoomChange={handleImageZoomChange} />
      </SheetContent>
    </Sheet>
  )
}

