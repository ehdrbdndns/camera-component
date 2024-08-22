'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Image from 'next/image'

import CHANGE from '@/images/camera-change.svg'
import CAPTURE from '@/images/capture.png'
import GALLERY from '@/images/gallery.svg'

export default function NewCamera({ initOpen = false }: { initOpen?: boolean }) {
  const [capturedImage, setCapturedImage] = useState<string>('')
  const [open, setOpen] = useState(initOpen)
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0)
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function createVideoConstraints(deviceId: string) {
    const videoContraints = {
      video: {
        deviceId: {
          exact: deviceId,
        },
      },
      audio: false,
    }

    return videoContraints
  }

  async function setCamera(videoContraints: MediaStreamConstraints) {
    const newMediaStream =
      await navigator.mediaDevices.getUserMedia(videoContraints)
    setCapturedImage('')
    if (videoRef.current) {
      videoRef.current.srcObject = newMediaStream
    }
  }

  async function getDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('enumerated devices not supported')
    }

    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = allDevices.filter(
      (device) => device.kind === 'videoinput',
    )

    return videoDevices
  }

  const handleCapturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) {
      return
    }

    canvasRef.current.width = videoRef.current.offsetWidth
    canvasRef.current.height = videoRef.current.offsetHeight

    canvasRef.current
      .getContext('2d')
      ?.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      )
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg'))
  }

  function updateSelectedDeviceIndex() {
    const newIndex = (selectedDeviceIndex + 1) % deviceList.length
    setSelectedDeviceIndex(newIndex)
    return newIndex
  }

  async function handleChangeCamera() {
    const newIndex = updateSelectedDeviceIndex()
    const videoContraints = createVideoConstraints(
      deviceList[newIndex].deviceId,
    )
    await setCamera(videoContraints)
  }

  const handleShowCamera = useCallback(async () => {
    try {
      // request video permission
      await navigator.mediaDevices.getUserMedia({ video: true })

      // get Divice
      const deviceList = await getDevices()
      setDeviceList(deviceList)

      // set video constraints
      const videoContraints = createVideoConstraints(
        deviceList[selectedDeviceIndex].deviceId,
      )

      // set camera by video constraints
      await setCamera(videoContraints)
    } catch (e) {
      // console.error(e);
    }
  }, [selectedDeviceIndex])

  const handleGalleryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0)

    if (!file || !file.type.startsWith('image/')) {
      alert('이미지 파일을 선택해주세요.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataURL = event.target?.result as string

      // Create an Image object
      let image = new (window as any).Image() as HTMLImageElement
      image.src = dataURL

      image.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          const context = canvas.getContext('2d')
          if (context) {
            // Get canvas and image dimensions
            const canvasWidth = canvas.width
            const canvasHeight = canvas.height
            const imageWidth = image.width
            const imageHeight = image.height

            // Calculate aspect ratios
            const canvasAspect = canvasWidth / canvasHeight
            const imageAspect = imageWidth / imageHeight

            let drawWidth, drawHeight, xOffset, yOffset

            // Determine the size and position to maintain aspect ratio
            if (imageAspect > canvasAspect) {
              // Image is wider than canvas
              drawWidth = canvasWidth
              drawHeight = canvasWidth / imageAspect
              xOffset = 0
              yOffset = (canvasHeight - drawHeight) / 2
            } else {
              // Image is taller than canvas or perfectly matches
              drawHeight = canvasHeight
              drawWidth = canvasHeight * imageAspect
              xOffset = (canvasWidth - drawWidth) / 2
              yOffset = 0
            }

            // Clear the canvas before drawing
            context.clearRect(0, 0, canvasWidth, canvasHeight)

            // Draw the image on the canvas
            context.drawImage(image, xOffset, yOffset, drawWidth, drawHeight)

            setCapturedImage(canvasRef.current.toDataURL('image/jpeg'))
          }
        }
      }
    }

    reader.readAsDataURL(file)
  }

  const handleRetakePhoto = () => {
    setCapturedImage('')
  }

  const handleSubmit = async () => {
    setOpen(false)

    // TODO Something for your business logic
  }

  useEffect(() => {
    (async () => {
      await handleShowCamera()
    })()
  }, [handleShowCamera])

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleShowCamera}
          >
            카메라 촬영하기
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카메라</DialogTitle>
            <DialogDescription>
              사진을 찍으세요!!
            </DialogDescription>
          </DialogHeader>
          <div>
            <div>
              {/* Camera or Captured Image */}
              <video
                width={462}
                height={346}
                id="video"
                ref={videoRef}
                hidden={capturedImage !== ''}
                playsInline
                autoPlay
              />
              <canvas
                width={462}
                height={346}
                id="canvas"
                ref={canvasRef}
                hidden={capturedImage === ''}
              />
            </div>
            {!capturedImage ? (
              <div className="flex justify-between mt-[24px]">
                {/* Gallery */}
                <div>
                  <input
                    type="file"
                    hidden
                    id="galleryImage"
                    accept="image/*"
                    onChange={(e) => handleGalleryImage(e)}
                  />
                  <label htmlFor="galleryImage">
                    <Image
                      className="w-[44px] h-[44px] cursor-pointer"
                      src={GALLERY}
                      alt="gallery image"
                    />
                  </label>
                </div>
                {/* Capture */}
                <Image
                  width={44}
                  height={44}
                  className="w-[44px] h-[44px] cursor-pointer"
                  src={CAPTURE}
                  alt="capture image"
                  onClick={handleCapturePhoto}
                />
                {/* Change Camera */}
                <Image
                  width={44}
                  height={44}
                  className="w-[44px] h-[44px] cursor-pointer"
                  src={CHANGE}
                  alt="change camera image"
                  onClick={handleChangeCamera}
                />
              </div>
            ) : (
              <div className="flex justify-between mt-[24px]">
                <Button onClick={handleRetakePhoto}>재촬영</Button>
                <Button onClick={handleSubmit}>확인</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
