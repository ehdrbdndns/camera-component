"use client"

import { useEffect, useRef, useState } from "react";

export default function Camera() {
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<MediaDeviceInfo>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function createVideoConstraints(deviceId: string) {
    const videoContraints = {
      video: {
        deviceId: {
          exact: deviceId,
        },
      },
      audio: false
    }

    return videoContraints;
  }

  async function setCamera(videoContraints: MediaStreamConstraints) {
    const newMediaStream = await navigator.mediaDevices.getUserMedia(videoContraints);
    if (videoRef.current) {
      videoRef.current.srcObject = newMediaStream;
    }
  }

  async function getDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error("enumerated devices not supported");
    }

    let allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = allDevices.filter((device) => device.kind === "videoinput");

    return videoDevices;
  }

  const handleCapture = async () => {
    if (!canvasRef.current || !videoRef.current) {
      console.error("canvas or video is not ready");
      return;
    }

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    canvasRef.current.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setCapturedImage(canvasRef.current.toDataURL("image/jpeg"));
  }

  async function changeCamera(device: MediaDeviceInfo) {
    const videoContraints = createVideoConstraints(device.deviceId);
    setSelectedDevice(device);
    await setCamera(videoContraints);
  }

  useEffect(() => {
    const showCamera = async () => {
      try {
        // request video permission
        await navigator.mediaDevices.getUserMedia({ video: true });

        // get Divice
        const deviceList = await getDevices();
        setDeviceList(deviceList);
        setSelectedDevice(deviceList[0]);

        // set video constraints
        const videoContraints = createVideoConstraints(deviceList[0].deviceId);

        //set camera by video constraints
        await setCamera(videoContraints);

      } catch (e) {
        console.error(e);
      }
    }

    (async () => {
      await showCamera();
    })();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <h3>Camera</h3>
          <video id="video" ref={videoRef} playsInline autoPlay></video>
        </div>
        <div>
          <h3>Canvas</h3>
          <canvas id="canvas" ref={canvasRef}></canvas>
        </div>
      </div>
      <div>
        <button onClick={handleCapture}>Capture</button>
      </div>
      <div>
        <h3>Device List</h3>
        <ul>
          {deviceList.map((device, index) => (
            <div key={index} style={{ display: 'flex', gap: '1rem' }}>
              <li>{device.label}</li>
              <button onClick={() => changeCamera(device)}>변경</button>
            </div>
          ))}
        </ul>
      </div>
    </div>
  )
}
