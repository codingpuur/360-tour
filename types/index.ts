export type SensorType   = 'temperature' | 'vibration' | 'humidity' | 'pressure' | 'airquality' | 'power'
export type SensorStatus = 'normal' | 'warn' | 'danger'

export interface SensorData {
  type:   SensorType
  value?: string
  unit?:  string
  status?: SensorStatus
}

export interface LonLat {
  lon: number
  lat: number
}

export interface HotspotDoc {
  _id: string
  sceneId: string
  type: 'navigation' | 'info'
  position: LonLat
  label: string
  targetSceneId?: string
  targetView?: LonLat
  content?: {
    title?: string
    text?: string
    image?: string
    video?: string
    link?: string
  }
  icon: 'arrow' | 'dot' | 'ring' | 'info' | 'custom'
  style?: {
    color?: string
    scale?: number
  }
  sensor?: SensorData
}

export interface SceneDoc {
  _id: string
  tourId: string
  name: string
  panorama: string
  preview: string
  initialView: LonLat & { fov: number }
  order: number
  hotspots: HotspotDoc[]
}

export type TransitionType = 'fade' | 'fade-white' | 'zoom' | 'blur' | 'instant' | 'crossfade'

export interface TourDoc {
  _id: string
  slug: string
  title: string
  description: string
  coverImage: string
  startSceneId: string
  floorplan?: {
    image: string
    markers: Array<{ sceneId: string; x: number; y: number }>
  }
  isPublished: boolean
  settings: {
    autoRotate: boolean
    showCompass: boolean
    allowEmbed: boolean
    transition: TransitionType
  }
  scenes: SceneDoc[]
  createdAt: string
  updatedAt: string
}
