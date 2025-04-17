"use client"

import { Download, Printer } from "lucide-react"

const ActionButtons = ({ finalImage, disabled }) => {
  const handleDownload = () => {
    if (finalImage) {
      const link = document.createElement("a")
      link.href = finalImage
      link.download = "photobooth-creation.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePrint = () => {
    if (finalImage) {
      const printWindow = window.open("", "_blank")
      printWindow.document.write(`
        <html>
          <head>
            <title>In ảnh</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
              }
              @media print {
                body {
                  height: auto;
                }
              }
            </style>
          </head>
          <body>
            <img src="${finalImage}" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 200);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="w-full flex justify-center gap-4 mt-2">
      <button
        onClick={handleDownload}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
        }`}
      >
        <Download className="h-5 w-5" />
        <span>Tải xuống</span>
      </button>

      <button
        onClick={handlePrint}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
        }`}
      >
        <Printer className="h-5 w-5" />
        <span>In ảnh</span>
      </button>
    </div>
  )
}

export default ActionButtons
