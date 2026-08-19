export interface GalleryItem {
  id: string
  type: 'photo' | 'video'
  src: string
  caption?: string
  /** Render with the white polaroid-style border instead of a plain tile. */
  polaroid?: boolean
}
