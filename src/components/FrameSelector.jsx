"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const FrameSelector = ({ frames, selectedFrame, setSelectedFrame }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const scrollContainerRef = useRef(null)

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      // Initial check
      handleScroll()

      return () => scrollContainer.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  // Function to render frame preview based on frame type
  const renderFramePreview = (frame, index) => {
    const { id, slots, orientation } = frame

    // Create a small canvas to render the frame preview
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = 100
    canvas.height = 150

    // Fill with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw frame layout
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2

    switch (id) {
      case 1: // 2x6" 3 Photo vertical
        for (let i = 1; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(0, i * (canvas.height / 3))
          ctx.lineTo(canvas.width, i * (canvas.height / 3))
          ctx.stroke()
        }
        break

      case 2: // 2x6" 4 Photo vertical
        for (let i = 1; i < 4; i++) {
          ctx.beginPath()
          ctx.moveTo(0, i * (canvas.height / 4))
          ctx.lineTo(canvas.width, i * (canvas.height / 4))
          ctx.stroke()
        }
        break

      case 3: // 4x6" 6 Photo vertical
        for (let i = 1; i < 6; i++) {
          ctx.beginPath()
          ctx.moveTo(0, i * (canvas.height / 6))
          ctx.lineTo(canvas.width, i * (canvas.height / 6))
          ctx.stroke()
        }
        break

      case 4: // 4x6" Portrait single
        // Just a border
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        break

      case 5: // 4x6" Landscape single
        // Just a border
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        break

      case 6: // 4x6" Triple horizontal
        for (let i = 1; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(i * (canvas.width / 3), 0)
          ctx.lineTo(i * (canvas.width / 3), canvas.height)
          ctx.stroke()
        }
        break

      case 7: // 4x6" 3 Photo Split (2 small on left, 1 large on right)
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width / 2, canvas.height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        ctx.lineTo(canvas.width / 2, canvas.height / 2)
        ctx.stroke()
        break

      case 8: // 4x6" 3 Photo Alt (1 large on left, 2 small on right)
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width / 2, canvas.height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, canvas.height / 2)
        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
        break

      case 9: // 4x6" 4 Photo grid
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width / 2, canvas.height)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
        break

      case 10: // 4x6" 2 Photo split
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width / 2, canvas.height)
        ctx.stroke()
        break

      case 11: // 4x6" 2 Photo horizontal
        ctx.beginPath()
        ctx.moveTo(0, canvas.height / 2)
        ctx.lineTo(canvas.width, canvas.height / 2)
        ctx.stroke()
        break
    }

    // Add frame number
    ctx.fillStyle = "#000"
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "center"
    ctx.fillText(id, canvas.width / 2, 25)

    // Add small text for frame type
    ctx.font = "10px Arial"
    ctx.fillText(`${slots} Hình`, canvas.width / 2, canvas.height - 10)

    return canvas.toDataURL()
  }

  return (
    <div className="w-full mb-6 relative">
      <h3 className="text-lg font-semibold text-purple-600 mb-3">Chọn bố cục khung hình</h3>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 text-purple-600" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {frames.map((frame, index) => (
            <div key={index} className="flex-shrink-0 w-24 h-36 mx-2 snap-start first:ml-0 last:mr-0">
              <button
                onClick={() => setSelectedFrame(index)}
                className={`w-full h-full rounded-lg overflow-hidden border-4 transition-all ${
                  selectedFrame === index
                    ? "border-purple-500 scale-110 shadow-lg"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <img
                  src={renderFramePreview(frame, index) || "/placeholder.svg"}
                  alt={`Frame ${frame.id}`}
                  className="w-full h-full object-cover"
                />
              </button>
              <p className="text-xs text-center mt-1 text-gray-600">{frame.slots} Hình</p>
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1 shadow-md"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 text-purple-600" />
          </button>
        )}
      </div>
    </div>
  )
}

export default FrameSelector
