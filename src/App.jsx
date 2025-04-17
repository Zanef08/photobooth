import PhotoBooth from "./components/PhotoBooth"
import "./App.css"

function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-purple-600 mb-2">Fun Photo Booth</h1>
          <p className="text-lg text-purple-500">Capture, Frame, and Share Your Memories!</p>
        </header>
        <PhotoBooth />
      </div>
    </main>
  )
}

export default App
