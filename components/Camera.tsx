"use client"

import { useEffect, useRef, useState } from "react";

export default function Camera() {
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);

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
      videoRef.current.style.display = "block";
    }

    if (canvasRef.current) {
      canvasRef.current.style.display = "none";
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

  const handleCapturePhoto = async () => {
    if (!canvasRef.current || !videoRef.current) {
      console.error("canvas or video is not ready");
      return;
    }

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    canvasRef.current.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setCapturedImage(canvasRef.current.toDataURL("image/jpeg"));

    if (videoRef.current) {
      videoRef.current.style.display = "none";
    }

    if (canvasRef.current) {
      canvasRef.current.style.display = "block";
    }
  }

  const handleRetakePhoto = () => {
    setCapturedImage("");
    if (videoRef.current) {
      videoRef.current.style.display = "block";
    }

    if (canvasRef.current) {
      canvasRef.current.style.display = "none";
    }
  }

  async function changeCamera(device: MediaDeviceInfo) {
    const videoContraints = createVideoConstraints(device.deviceId);
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
          <h3>{capturedImage ? "사진" : "카메라"}</h3>
          <video id="video" ref={videoRef} playsInline autoPlay />
          <canvas id="canvas" ref={canvasRef} />
        </div>
      </div>
      <div style={{ marginTop: "1rem" }}>
        {capturedImage
          ? <button onClick={handleRetakePhoto}>재촬영</button>
          : <button onClick={handleCapturePhoto}>사진찍기</button>
        }
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
