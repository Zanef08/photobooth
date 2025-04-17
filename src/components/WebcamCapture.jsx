"use client"

import { useRef, useState, useEffect } from "react"
import { Clock, AlertTriangle } from "lucide-react"

const WebcamCapture = ({ onCapture, countdownDuration = 3, onError }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [cameraError, setCameraError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const startWebcam = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser")
      }

      setPermissionRequested(true)

      // Try to get the webcam stream
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      setStream(userMedia)

      if (videoRef.current) {
        videoRef.current.srcObject = userMedia
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }

      setCameraError(false)
      setErrorMessage("")
    } catch (err) {
      console.error("Error accessing webcam:", err)
      setCameraError(true)

      // Set a more specific error message based on the error
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("Không tìm thấy camera. Vui lòng kiểm tra thiết bị của bạn.")
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.")
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMessage("Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.")
      } else {
        setErrorMessage(`Không thể truy cập camera: ${err.message || "Lỗi không xác định"}`)
      }

      // Notify parent component about the error
      if (onError) {
        onError(err)
      }
    }
  }

  useEffect(() => {
    // Start webcam when component mounts
    startWebcam()

    // Clean up when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    // Start countdown
    setCountdown(countdownDuration)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)

          // Take the actual photo
          const video = videoRef.current
          const canvas = canvasRef.current
          const context = canvas.getContext("2d")

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw the video frame to the canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Get the image data as a data URL
          const imageData = canvas.toDataURL("image/png")

          // Pass the captured image to the parent component
          setTimeout(() => {
            onCapture(imageData)
          }, 500) // Short delay to show the captured frame

          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const retryWebcam = () => {
    startWebcam()
  }

  // If there's a camera error, show an error message with retry option
  if (cameraError) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6">
        <div className="text-center p-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Không thể truy cập camera</h3>
          <p className="mb-6 text-gray-600">{errorMessage}</p>

          <div className="space-y-3">
            <button
              onClick={retryWebcam}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Thử lại
            </button>

            <button
              onClick={() => onCapture(null)} // Return to main interface
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Quay lại
            </button>
          </div>

          {permissionRequested && (
            <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
              <p className="mb-2">Mẹo khắc phục sự cố:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Đảm bảo thiết bị của bạn có camera</li>
                <li>Kiểm tra quyền truy cập camera trong cài đặt trình duyệt</li>
                <li>Đóng các ứng dụng khác có thể đang sử dụng camera</li>
                <li>Làm mới trang và thử lại</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onError={() => {
          setCameraError(true)
          setErrorMessage("Lỗi khi tải video từ camera")
        }}
      />

      {countdown && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white text-7xl font-bold rounded-full w-32 h-32 flex items-center justify-center">
            {countdown}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!countdown && cameraReady && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
          <button
            onClick={capturePhoto}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full py-3 px-6 shadow-lg flex items-center justify-center"
          >
            <span className="mr-2">Bắt đầu chụp</span>
            <Clock className="h-5 w-5" />
            <span className="ml-1">{countdownDuration}s</span>
          </button>
        </div>
      )}

      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>Đang kết nối với camera...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebcamCapture
