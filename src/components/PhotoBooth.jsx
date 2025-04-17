"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Camera, Upload } from "lucide-react"
import FrameSelector from "./FrameSelector"
import ActionButtons from "./ActionButtons"
import WebcamCapture from "./WebcamCapture"

const PhotoBooth = () => {
  // State để quản lý ảnh và khung
  const [allPhotos, setAllPhotos] = useState([]) // Tất cả ảnh đã chụp/tải lên
  const [framePhotos, setFramePhotos] = useState([]) // Ảnh được gán vào khung
  const [selectedFrame, setSelectedFrame] = useState(0)
  const [finalImage, setFinalImage] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [countdownDuration, setCountdownDuration] = useState(3) // Default 3 seconds
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(null) // For editing/replacing a specific photo
  const [photoZoom, setPhotoZoom] = useState({}) // Store zoom levels for each photo
  const [photoPosition, setPhotoPosition] = useState({}) // Store position for each photo
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cameraError, setCameraError] = useState(false)
  const canvasRef = useRef(null)

  // Frame configurations
  const frameConfigs = [
    { id: 1, name: '2x6" 3 Photo', slots: 3, orientation: "portrait" },
    { id: 2, name: '2x6" 4 Photo', slots: 4, orientation: "portrait" },
    { id: 3, name: '4x6" 6 Photo', slots: 6, orientation: "portrait" },
    { id: 4, name: '4x6" Portrait', slots: 1, orientation: "portrait" },
    { id: 5, name: '4x6" Landscape', slots: 1, orientation: "landscape" },
    { id: 6, name: '4x6" Triple', slots: 3, orientation: "landscape" },
    { id: 7, name: '4x6" 3 Photo Split', slots: 3, orientation: "custom1" },
    { id: 8, name: '4x6" 3 Photo Alt', slots: 3, orientation: "custom2" },
    { id: 9, name: '4x6" 4 Photo', slots: 4, orientation: "grid" },
    { id: 10, name: '4x6" 2 Photo', slots: 2, orientation: "split" },
    { id: 11, name: '4x6" 2 Photo Alt', slots: 2, orientation: "horizontal" },
  ]

  // Xử lý tải ảnh lên
  const handleImageUpload = (e, frameIndex = null) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const promises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve(e.target.result)
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(promises).then((results) => {
        // Thêm ảnh mới vào allPhotos
        setAllPhotos((prev) => [...prev, ...results])

        if (frameIndex !== null) {
          // Thay thế ảnh cụ thể trong khung
          const newPhotoIndex = allPhotos.length // Chỉ số của ảnh mới trong allPhotos
          setFramePhotos((prev) => {
            const newFramePhotos = [...prev]
            newFramePhotos[frameIndex] = newPhotoIndex
            return newFramePhotos
          })

          // Khởi tạo zoom và vị trí cho ảnh này
          setPhotoZoom((prev) => ({ ...prev, [frameIndex]: 1 }))
          setPhotoPosition((prev) => ({ ...prev, [frameIndex]: { x: 0, y: 0 } }))
        } else {
          // Thêm ảnh mới vào khung
          results.forEach((_, i) => {
            const newPhotoIndex = allPhotos.length + i

            // Chỉ thêm vào khung nếu còn chỗ trống
            if (framePhotos.length < currentConfig.slots) {
              setFramePhotos((prev) => [...prev, newPhotoIndex])

              // Khởi tạo zoom và vị trí cho ảnh mới
              const frameIndex = framePhotos.length
              setPhotoZoom((prevZoom) => ({ ...prevZoom, [frameIndex]: 1 }))
              setPhotoPosition((prevPos) => ({ ...prevPos, [frameIndex]: { x: 0, y: 0 } }))
            }
          })
        }
      })
    }
  }

  // Xử lý chụp ảnh từ webcam
  const handleCameraCapture = (imageSrc) => {
    // If user canceled or there was an error
    if (!imageSrc) {
      setShowCamera(false)
      return
    }

    // Thêm ảnh mới vào allPhotos
    setAllPhotos((prev) => [...prev, imageSrc])
    const newPhotoIndex = allPhotos.length // Chỉ số của ảnh mới trong allPhotos

    if (currentPhotoIndex !== null) {
      // Thay thế ảnh cụ thể trong khung
      setFramePhotos((prev) => {
        const newFramePhotos = [...prev]
        newFramePhotos[currentPhotoIndex] = newPhotoIndex
        return newFramePhotos
      })

      // Khởi tạo zoom và vị trí cho ảnh này
      setPhotoZoom((prev) => ({ ...prev, [currentPhotoIndex]: 1 }))
      setPhotoPosition((prev) => ({ ...prev, [currentPhotoIndex]: { x: 0, y: 0 } }))
      setCurrentPhotoIndex(null)
    } else {
      // Thêm ảnh mới vào khung nếu còn chỗ trống
      if (framePhotos.length < currentConfig.slots) {
        setFramePhotos((prev) => [...prev, newPhotoIndex])

        // Khởi tạo zoom và vị trí cho ảnh mới
        const frameIndex = framePhotos.length
        setPhotoZoom((prevZoom) => ({ ...prevZoom, [frameIndex]: 1 }))
        setPhotoPosition((prevPos) => ({ ...prevPos, [frameIndex]: { x: 0, y: 0 } }))
      }
    }

    setShowCamera(false)
  }

  const handleCameraError = (error) => {
    console.error("Camera error in parent component:", error)
    setCameraError(true)
  }

  // Xóa ảnh khỏi khung (không xóa khỏi thư viện)
  const removePhoto = (frameIndex) => {
    // Xóa ảnh khỏi khung
    setFramePhotos((prev) => {
      const newFramePhotos = [...prev]
      newFramePhotos.splice(frameIndex, 1)
      return newFramePhotos
    })

    // Cập nhật zoom và vị trí
    setPhotoZoom((prev) => {
      const newZoom = { ...prev }
      delete newZoom[frameIndex]
      // Đánh chỉ số lại cho các ảnh còn lại
      Object.keys(newZoom).forEach((key) => {
        const keyNum = Number.parseInt(key)
        if (keyNum > frameIndex) {
          newZoom[keyNum - 1] = newZoom[keyNum]
          delete newZoom[keyNum]
        }
      })
      return newZoom
    })

    setPhotoPosition((prev) => {
      const newPos = { ...prev }
      delete newPos[frameIndex]
      // Đánh chỉ số lại cho các ảnh còn lại
      Object.keys(newPos).forEach((key) => {
        const keyNum = Number.parseInt(key)
        if (keyNum > frameIndex) {
          newPos[keyNum - 1] = newPos[keyNum]
          delete newPos[keyNum]
        }
      })
      return newPos
    })
  }

  const startPhotoCapture = (index = null) => {
    setCurrentPhotoIndex(index)
    setShowCamera(true)
    setCameraError(false)
  }

  // Xử lý khi nhấp vào ảnh trong khung
  const handlePhotoClick = (frameIndex) => {
    // Show options to replace or edit the photo
    const photoEl = document.getElementById(`frame-photo-${frameIndex}`)
    if (photoEl) {
      const rect = photoEl.getBoundingClientRect()

      // Create a floating menu
      const menu = document.createElement("div")
      menu.id = "photo-menu"
      menu.className = "absolute bg-white rounded-lg shadow-lg p-2 z-50 flex flex-col gap-2"
      menu.style.top = `${rect.bottom + window.scrollY + 5}px`
      menu.style.left = `${rect.left + window.scrollX}px`

      menu.innerHTML = `
      <button id="take-new-photo" class="text-sm flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
        Chụp ảnh mới
      </button>
      <button id="upload-new-photo" class="text-sm flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        Tải ảnh mới
      </button>
      <button id="choose-from-gallery" class="text-sm flex items-center gap-1 px-3 py-1 hover:bg-gray-100 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        Chọn từ thư viện
      </button>
      <button id="delete-photo" class="text-sm flex items-center gap-1 px-3 py-1 hover:bg-red-100 text-red-600 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        Xóa khỏi khung
      </button>
    `

      document.body.appendChild(menu)

      // Add event listeners
      document.getElementById("take-new-photo").addEventListener("click", () => {
        startPhotoCapture(frameIndex)
        document.body.removeChild(menu)
      })

      document.getElementById("upload-new-photo").addEventListener("click", () => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => handleImageUpload(e, frameIndex)
        input.click()
        document.body.removeChild(menu)
      })

      document.getElementById("choose-from-gallery").addEventListener("click", () => {
        // Hiển thị modal để chọn ảnh từ thư viện
        showGalleryModal(frameIndex)
        document.body.removeChild(menu)
      })

      document.getElementById("delete-photo").addEventListener("click", () => {
        removePhoto(frameIndex)
        document.body.removeChild(menu)
      })

      // Close menu when clicking outside
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== photoEl) {
          document.body.removeChild(menu)
          document.removeEventListener("click", closeMenu)
        }
      }

      // Delay adding the event listener to prevent immediate closing
      setTimeout(() => {
        document.addEventListener("click", closeMenu)
      }, 100)
    }
  }

  // Hiển thị modal chọn ảnh từ thư viện
  const showGalleryModal = (frameIndex) => {
    const modal = document.createElement("div")
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    modal.innerHTML = `
    <div class="bg-white rounded-xl p-6 max-w-2xl mx-4 w-full">
      <h3 class="text-lg font-semibold text-purple-600 mb-3">Chọn ảnh từ thư viện</h3>
      <div id="gallery-grid" class="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2">
        ${allPhotos
          .map(
            (photo, idx) => `
          <div class="gallery-item cursor-pointer rounded-lg overflow-hidden border-2 hover:border-purple-500" data-index="${idx}">
            <img src="${photo}" alt="Gallery photo ${idx + 1}" class="w-full h-24 object-cover">
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button id="cancel-gallery" class="px-4 py-2 text-gray-600 hover:text-gray-800">Hủy</button>
      </div>
    </div>
  `
    document.body.appendChild(modal)

    // Xử lý sự kiện khi chọn ảnh
    document.querySelectorAll(".gallery-item").forEach((item) => {
      item.addEventListener("click", () => {
        const photoIndex = Number.parseInt(item.getAttribute("data-index"))

        // Thêm ảnh đã chọn vào khung
        setFramePhotos((prev) => {
          const newFramePhotos = [...prev]
          if (frameIndex < newFramePhotos.length) {
            // Thay thế ảnh hiện tại
            newFramePhotos[frameIndex] = photoIndex
          } else {
            // Thêm ảnh mới
            newFramePhotos.push(photoIndex)
          }
          return newFramePhotos
        })

        // Khởi tạo zoom và vị trí cho ảnh này
        setPhotoZoom((prev) => ({ ...prev, [frameIndex]: 1 }))
        setPhotoPosition((prev) => ({ ...prev, [frameIndex]: { x: 0, y: 0 } }))

        document.body.removeChild(modal)
      })
    })

    // Xử lý sự kiện khi nhấn nút hủy
    document.getElementById("cancel-gallery").addEventListener("click", () => {
      document.body.removeChild(modal)
    })
  }

  // Xử lý zoom ảnh
  const adjustZoom = (index, delta) => {
    setPhotoZoom((prev) => {
      const currentZoom = prev[index] || 1
      const newZoom = Math.max(0.5, Math.min(3, currentZoom + delta))
      return { ...prev, [index]: newZoom }
    })
  }

  // Xử lý kéo ảnh
  const startDrag = (index, e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const onDrag = (index, e) => {
    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    setDragStart({ x: e.clientX, y: e.clientY })

    setPhotoPosition((prev) => {
      const current = prev[index] || { x: 0, y: 0 }
      return {
        ...prev,
        [index]: {
          x: current.x + dx,
          y: current.y + dy,
        },
      }
    })
  }

  const endDrag = () => {
    setIsDragging(false)
  }

  // Vẽ ảnh lên canvas
  useEffect(() => {
    if (framePhotos.length > 0 && canvasRef.current && allPhotos.length > 0) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set canvas background to white
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw frame based on selected configuration
      const config = frameConfigs[selectedFrame]
      const loadedImages = []

      // Load all images first
      const imagePromises = framePhotos.slice(0, config.slots).map((photoIndex, index) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            loadedImages[index] = img
            resolve()
          }
          img.src = allPhotos[photoIndex] || ""
        })
      })

      // Once all images are loaded, draw them in the appropriate layout
      Promise.all(imagePromises).then(() => {
        drawImagesInLayout(ctx, loadedImages, config, canvas.width, canvas.height)
        setFinalImage(canvas.toDataURL("image/png"))
      })
    }
  }, [framePhotos, selectedFrame, frameConfigs, photoZoom, photoPosition, allPhotos])

  // Vẽ ảnh lên canvas theo bố cục khung
  const drawImagesInLayout = (ctx, images, config, canvasWidth, canvasHeight) => {
    const { id, slots } = config

    // Draw border lines
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2

    // Function to draw a "+" sign in empty slots
    const drawPlusSign = (x, y, width, height) => {
      // This is just for the preview - the actual "+" buttons will be added as HTML elements on top of the canvas
      ctx.fillStyle = "#f0f0f0"
      ctx.fillRect(x, y, width, height)

      ctx.strokeStyle = "#aaa"
      ctx.lineWidth = 3

      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(x + width * 0.3, y + height * 0.5)
      ctx.lineTo(x + width * 0.7, y + height * 0.5)
      ctx.stroke()

      // Vertical line
      ctx.beginPath()
      ctx.moveTo(x + width * 0.5, y + height * 0.3)
      ctx.lineTo(x + width * 0.5, y + height * 0.7)
      ctx.stroke()

      ctx.lineWidth = 2
      ctx.strokeStyle = "#000"
    }

    switch (id) {
      case 1: // 2x6" 3 Photo vertical
        for (let i = 0; i < 3; i++) {
          const y = (canvasHeight / 3) * i
          if (i < images.length) {
            drawImageWithZoomAndPosition(ctx, images[i], 0, y, canvasWidth, canvasHeight / 3, i)
          } else {
            drawPlusSign(0, y, canvasWidth, canvasHeight / 3)
          }

          if (i < 2) {
            ctx.beginPath()
            ctx.moveTo(0, (i + 1) * (canvasHeight / 3))
            ctx.lineTo(canvasWidth, (i + 1) * (canvasHeight / 3))
            ctx.stroke()
          }
        }
        break

      case 2: // 2x6" 4 Photo vertical
        for (let i = 0; i < 4; i++) {
          const y = (canvasHeight / 4) * i
          if (i < images.length) {
            drawImageWithZoomAndPosition(ctx, images[i], 0, y, canvasWidth, canvasHeight / 4, i)
          } else {
            drawPlusSign(0, y, canvasWidth, canvasHeight / 4)
          }

          if (i < 3) {
            ctx.beginPath()
            ctx.moveTo(0, (i + 1) * (canvasHeight / 4))
            ctx.lineTo(canvasWidth, (i + 1) * (canvasHeight / 4))
            ctx.stroke()
          }
        }
        break

      case 3: // 4x6" 6 Photo vertical
        for (let i = 0; i < 6; i++) {
          const y = (canvasHeight / 6) * i
          if (i < images.length) {
            drawImageWithZoomAndPosition(ctx, images[i], 0, y, canvasWidth, canvasHeight / 6, i)
          } else {
            drawPlusSign(0, y, canvasWidth, canvasHeight / 6)
          }

          if (i < 5) {
            ctx.beginPath()
            ctx.moveTo(0, (i + 1) * (canvasHeight / 6))
            ctx.lineTo(canvasWidth, (i + 1) * (canvasHeight / 6))
            ctx.stroke()
          }
        }
        break

      case 4: // 4x6" Portrait single
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth, canvasHeight, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth, canvasHeight)
        }
        break

      case 5: // 4x6" Landscape single
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth, canvasHeight, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth, canvasHeight)
        }
        break

      case 6: // 4x6" Triple horizontal
        for (let i = 0; i < 3; i++) {
          const x = (canvasWidth / 3) * i
          if (i < images.length) {
            drawImageWithZoomAndPosition(ctx, images[i], x, 0, canvasWidth / 3, canvasHeight, i)
          } else {
            drawPlusSign(x, 0, canvasWidth / 3, canvasHeight)
          }

          if (i < 2) {
            ctx.beginPath()
            ctx.moveTo((i + 1) * (canvasWidth / 3), 0)
            ctx.lineTo((i + 1) * (canvasWidth / 3), canvasHeight)
            ctx.stroke()
          }
        }
        break

      case 7: // 4x6" 3 Photo Split (2 small on left, 1 large on right)
        // Draw the two small photos on the left
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth / 2, canvasHeight / 2, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth / 2, canvasHeight / 2)
        }

        if (images.length > 1) {
          drawImageWithZoomAndPosition(ctx, images[1], 0, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2, 1)
        } else {
          drawPlusSign(0, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2)
        }

        // Draw the large photo on the right
        if (images.length > 2) {
          drawImageWithZoomAndPosition(ctx, images[2], canvasWidth / 2, 0, canvasWidth / 2, canvasHeight, 2)
        } else {
          drawPlusSign(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight)
        }

        // Draw dividing lines
        ctx.beginPath()
        ctx.moveTo(canvasWidth / 2, 0)
        ctx.lineTo(canvasWidth / 2, canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, canvasHeight / 2)
        ctx.lineTo(canvasWidth / 2, canvasHeight / 2)
        ctx.stroke()
        break

      case 8: // 4x6" 3 Photo Alt (1 large on left, 2 small on right)
        // Draw the large photo on the left
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth / 2, canvasHeight, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth / 2, canvasHeight)
        }

        // Draw the two small photos on the right
        if (images.length > 1) {
          drawImageWithZoomAndPosition(ctx, images[1], canvasWidth / 2, 0, canvasWidth / 2, canvasHeight / 2, 1)
        } else {
          drawPlusSign(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight / 2)
        }

        if (images.length > 2) {
          drawImageWithZoomAndPosition(
            ctx,
            images[2],
            canvasWidth / 2,
            canvasHeight / 2,
            canvasWidth / 2,
            canvasHeight / 2,
            2,
          )
        } else {
          drawPlusSign(canvasWidth / 2, canvasHeight / 2, canvasWidth / 2, canvasHeight / 2)
        }

        // Draw dividing lines
        ctx.beginPath()
        ctx.moveTo(canvasWidth / 2, 0)
        ctx.lineTo(canvasWidth / 2, canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(canvasWidth / 2, canvasHeight / 2)
        ctx.lineTo(canvasWidth, canvasHeight / 2)
        ctx.stroke()
        break

      case 9: // 4x6" 4 Photo grid
        for (let i = 0; i < 4; i++) {
          const x = (i % 2) * (canvasWidth / 2)
          const y = Math.floor(i / 2) * (canvasHeight / 2)

          if (i < images.length) {
            drawImageWithZoomAndPosition(ctx, images[i], x, y, canvasWidth / 2, canvasHeight / 2, i)
          } else {
            drawPlusSign(x, y, canvasWidth / 2, canvasHeight / 2)
          }
        }

        // Draw dividing lines
        ctx.beginPath()
        ctx.moveTo(canvasWidth / 2, 0)
        ctx.lineTo(canvasWidth / 2, canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, canvasHeight / 2)
        ctx.lineTo(canvasWidth, canvasHeight / 2)
        ctx.stroke()
        break

      case 10: // 4x6" 2 Photo split
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth / 2, canvasHeight, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth / 2, canvasHeight)
        }

        if (images.length > 1) {
          drawImageWithZoomAndPosition(ctx, images[1], canvasWidth / 2, 0, canvasWidth / 2, canvasHeight, 1)
        } else {
          drawPlusSign(canvasWidth / 2, 0, canvasWidth / 2, canvasHeight)
        }

        // Draw dividing line
        ctx.beginPath()
        ctx.moveTo(canvasWidth / 2, 0)
        ctx.lineTo(canvasWidth / 2, canvasHeight)
        ctx.stroke()
        break

      case 11: // 4x6" 2 Photo horizontal
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth, canvasHeight / 2, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth, canvasHeight / 2)
        }

        if (images.length > 1) {
          drawImageWithZoomAndPosition(ctx, images[1], 0, canvasHeight / 2, canvasWidth, canvasHeight / 2, 1)
        } else {
          drawPlusSign(0, canvasHeight / 2, canvasWidth, canvasHeight / 2)
        }

        // Draw dividing line
        ctx.beginPath()
        ctx.moveTo(0, canvasHeight / 2)
        ctx.lineTo(canvasWidth, canvasHeight / 2)
        ctx.stroke()
        break

      default:
        // Default to single image
        if (images.length > 0) {
          drawImageWithZoomAndPosition(ctx, images[0], 0, 0, canvasWidth, canvasHeight, 0)
        } else {
          drawPlusSign(0, 0, canvasWidth, canvasHeight)
        }
    }
  }

  // Xử lý khi nhấp vào canvas
  const handleCanvasClick = (e) => {
    if (!canvasRef.current || framePhotos.length >= currentConfig.slots) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate which slot was clicked based on the frame layout
    const { id } = currentConfig
    let slotIndex = -1

    switch (id) {
      case 1: // 2x6" 3 Photo vertical
        slotIndex = Math.floor((y / rect.height) * 3)
        break
      case 2: // 2x6" 4 Photo vertical
        slotIndex = Math.floor((y / rect.height) * 4)
        break
      case 3: // 4x6" 6 Photo vertical
        slotIndex = Math.floor((y / rect.height) * 6)
        break
      case 4: // 4x6" Portrait single
      case 5: // 4x6" Landscape single
        slotIndex = 0
        break
      case 6: // 4x6" Triple horizontal
        slotIndex = Math.floor((x / rect.width) * 3)
        break
      case 7: // 4x6" 3 Photo Split (2 small on left, 1 large on right)
        if (x < rect.width / 2) {
          slotIndex = y < rect.height / 2 ? 0 : 1
        } else {
          slotIndex = 2
        }
        break
      case 8: // 4x6" 3 Photo Alt (1 large on left, 2 small on right)
        if (x < rect.width / 2) {
          slotIndex = 0
        } else {
          slotIndex = y < rect.height / 2 ? 1 : 2
        }
        break
      case 9: // 4x6" 4 Photo grid
        const gridX = Math.floor((x / rect.width) * 2)
        const gridY = Math.floor((y / rect.height) * 2)
        slotIndex = gridY * 2 + gridX
        break
      case 10: // 4x6" 2 Photo split
        slotIndex = x < rect.width / 2 ? 0 : 1
        break
      case 11: // 4x6" 2 Photo horizontal
        slotIndex = y < rect.height / 2 ? 0 : 1
        break
    }

    // If we have a valid slot and it's empty or we're replacing
    if (slotIndex >= 0 && slotIndex < currentConfig.slots) {
      if (slotIndex >= framePhotos.length) {
        // Show options to add photo
        const options = document.createElement("div")
        options.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        options.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-xs mx-4">
          <h3 class="text-lg font-semibold text-purple-600 mb-3">Thêm hình ảnh</h3>
          <div class="flex gap-3 justify-center">
            <button id="take-photo-option" class="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
              Chụp ảnh
            </button>
            <button id="upload-photo-option" class="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Tải ảnh lên
            </button>
          </div>
          ${
            allPhotos.length > 0
              ? `
            <button id="choose-from-gallery-option" class="mt-3 w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Chọn từ thư viện
            </button>
          `
              : ""
          }
          <button id="cancel-option" class="mt-4 text-sm text-gray-500 w-full text-center">Hủy</button>
        </div>
      `
        document.body.appendChild(options)

        document.getElementById("take-photo-option").addEventListener("click", () => {
          startPhotoCapture(slotIndex)
          document.body.removeChild(options)
        })

        document.getElementById("upload-photo-option").addEventListener("click", () => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/*"
          input.onchange = (e) => handleImageUpload(e, slotIndex)
          input.click()
          document.body.removeChild(options)
        })

        if (allPhotos.length > 0) {
          document.getElementById("choose-from-gallery-option").addEventListener("click", () => {
            showGalleryModal(slotIndex)
            document.body.removeChild(options)
          })
        }

        document.getElementById("cancel-option").addEventListener("click", () => {
          document.body.removeChild(options)
        })
      } else {
        // Existing photo - show edit options
        handlePhotoClick(slotIndex)
      }
    }
  }

  // Vẽ ảnh với zoom và vị trí
  const drawImageWithZoomAndPosition = (ctx, img, x, y, width, height, index) => {
    // Get zoom and position for this image
    const zoom = photoZoom[index] || 1
    const position = photoPosition[index] || { x: 0, y: 0 }

    // Save the current context state
    ctx.save()

    // Create a clipping region for this image cell
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    // Calculate dimensions with zoom
    const zoomedWidth = img.width * zoom
    const zoomedHeight = img.height * zoom

    // Calculate position to center the image
    const aspectRatio = img.width / img.height
    const cellAspectRatio = width / height

    let drawWidth, drawHeight, drawX, drawY

    if (aspectRatio > cellAspectRatio) {
      // Image is wider than cell
      drawHeight = height
      drawWidth = height * aspectRatio
      drawX = x + (width - drawWidth) / 2 + position.x
      drawY = y + position.y
    } else {
      // Image is taller than cell
      drawWidth = width
      drawHeight = width / aspectRatio
      drawX = x + position.x
      drawY = y + (height - drawHeight) / 2 + position.y
    }

    // Apply zoom
    drawWidth *= zoom
    drawHeight *= zoom
    drawX -= (drawWidth - width) / 2
    drawY -= (drawHeight - height) / 2

    // Draw the image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // Restore the context state
    ctx.restore()
  }

  const currentConfig = frameConfigs[selectedFrame]

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Photo gallery (display only) */}
        <div className="md:col-span-1 flex flex-col">
          <div>
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Thư viện ảnh</h2>

            {/* Photo gallery - display all photos */}
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto pr-2">
              {allPhotos.map((photo, index) => (
                <div
                  key={`gallery-${index}`}
                  className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ aspectRatio: "3/4" }}
                  onClick={() => {
                    // Nếu khung còn chỗ trống, thêm ảnh này vào khung
                    if (framePhotos.length < currentConfig.slots) {
                      setFramePhotos((prev) => [...prev, index])

                      // Khởi tạo zoom và vị trí cho ảnh mới
                      const frameIndex = framePhotos.length
                      setPhotoZoom((prevZoom) => ({ ...prevZoom, [frameIndex]: 1 }))
                      setPhotoPosition((prevPos) => ({ ...prevPos, [frameIndex]: { x: 0, y: 0 } }))
                    } else {
                      // Hiển thị thông báo khung đã đầy
                      alert("Khung hình đã đầy. Vui lòng xóa một ảnh trước khi thêm ảnh mới.")
                    }
                  }}
                >
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2">
                    Hình {index + 1}
                  </div>
                </div>
              ))}

              {/* Hiển thị nút chụp ảnh/tải lên nếu chưa có ảnh nào */}
              {allPhotos.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6 text-center">
                  <div className="text-gray-400 mb-4">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p>Chưa có ảnh nào trong thư viện</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCamera(true)}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-2 px-4 rounded-lg text-sm"
                    >
                      Chụp ảnh
                    </button>
                    <label className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg text-sm cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      Tải ảnh lên
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Countdown timer options */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Thời gian đếm ngược</h3>
              <div className="flex gap-2">
                {[3, 5, 10].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setCountdownDuration(seconds)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      countdownDuration === seconds
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center and right columns - Preview and actions (interactive) */}
        <div className="md:col-span-2">
          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
            {/* Preview area - main interaction */}
            <div className="relative w-full aspect-[4/6] max-w-md mx-auto mb-6 bg-white rounded-xl overflow-hidden shadow-md">
              {showCamera ? (
                <WebcamCapture
                  onCapture={handleCameraCapture}
                  countdownDuration={countdownDuration}
                  onError={handleCameraError}
                />
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={900}
                    className="w-full h-full object-contain"
                    onClick={handleCanvasClick}
                  />
                  {framePhotos.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Plus size={64} />
                      <p className="mt-4 text-center px-4">Nhấn vào đây để thêm hình ảnh</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Frame selector */}
            <FrameSelector frames={frameConfigs} selectedFrame={selectedFrame} setSelectedFrame={setSelectedFrame} />

            {/* Main action buttons */}
            <div className="w-full flex justify-center gap-4 mb-4">
              {!showCamera && (
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
                >
                  <Camera className="h-5 w-5" />
                  <span>Chụp ảnh</span>
                </button>
              )}

              {!showCamera && (
                <label className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 transition-opacity cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Upload className="h-5 w-5" />
                  <span>Tải ảnh lên</span>
                </label>
              )}
            </div>

            {/* Action buttons */}
            <ActionButtons finalImage={finalImage} disabled={framePhotos.length === 0} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoBooth
