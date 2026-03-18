import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function App() {
  const mountRef = useRef(null)
  const sceneRef = useRef({})
  const [wishVisible, setWishVisible] = useState(false)
  const [hintHidden, setHintHidden] = useState(false)
  const [opened, setOpened] = useState(false)
  const [replayVisible, setReplayVisible] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    const W = window.innerWidth
    const H = window.innerHeight

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0400, 1)
    mount.appendChild(renderer.domElement)

    // ── Scene & Camera ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0400, 0.018)
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200)
    camera.position.set(0, 0, 5)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x1a0a00, 1.5))
    const pointLight = new THREE.PointLight(0xff8800, 0, 8)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)
    const dirLight = new THREE.DirectionalLight(0xffa040, 0.8)
    dirLight.position.set(3, 5, 3)
    scene.add(dirLight)

    // ── Cube group ──
    const cubeGroup = new THREE.Group()
    scene.add(cubeGroup)

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xff9922,
      transparent: true,
      opacity: 0.13,
      roughness: 0.05,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffaa22, linewidth: 2 })

    const SIZE = 2
    const faceData = [
      { pos: [0, 0,  SIZE / 2], rx: 0,            ry: 0            },
      { pos: [0, 0, -SIZE / 2], rx: 0,            ry: Math.PI      },
      { pos: [-SIZE / 2, 0, 0], rx: 0,            ry: -Math.PI / 2 },
      { pos: [ SIZE / 2, 0, 0], rx: 0,            ry:  Math.PI / 2 },
      { pos: [0,  SIZE / 2, 0], rx: -Math.PI / 2, ry: 0            },
      { pos: [0, -SIZE / 2, 0], rx:  Math.PI / 2, ry: 0            },
    ]

    const faceGeo = new THREE.PlaneGeometry(SIZE, SIZE)
    const faces = []

    // Store original closed state per face
    const faceClosedRotations = []
    const faceClosedPositions = []
    const faceClosedOpacities = []

    faceData.forEach(({ pos, rx, ry }) => {
      const mesh = new THREE.Mesh(faceGeo, glassMat.clone())
      mesh.position.set(...pos)
      mesh.rotation.x = rx
      mesh.rotation.y = ry
      cubeGroup.add(mesh)
      const edgeGeo = new THREE.EdgesGeometry(faceGeo)
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat.clone()))
      faces.push(mesh)
      faceClosedRotations.push({ x: rx, y: ry, z: 0 })
      faceClosedPositions.push({ x: pos[0], y: pos[1], z: pos[2] })
      faceClosedOpacities.push(0.13)
    })

    const faceOpenRotations = [
      { x:  Math.PI * 0.65, y: 0,              z: 0 },
      { x: -Math.PI * 0.65, y: Math.PI,        z: 0 },
      { x: 0,               y: -Math.PI * 1.15,z: 0 },
      { x: 0,               y:  Math.PI * 1.15,z: 0 },
      { x: -Math.PI,        y: 0,              z: 0 },
      { x:  Math.PI,        y: 0,              z: 0 },
    ]

    const faceOpenPositions = faces.map(face => {
      const dir = face.position.clone().normalize()
      return {
        x: face.position.x + dir.x * 0.7,
        y: face.position.y + dir.y * 0.7,
        z: face.position.z + dir.z * 0.7,
      }
    })

    // ── Particles ──
    const particleCount = 80
    const pPositions = new Float32Array(particleCount * 3)
    const pData = []
    for (let i = 0; i < particleCount; i++) {
      pData.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.8 + Math.random() * 1.8,
        yBase: -10,
        speed: 0.002 + Math.random() * 0.004,
        riseSpeed: 0.005 + Math.random() * 0.01,
        active: false,
      })
      pPositions[i * 3] = 0; pPositions[i * 3 + 1] = -10; pPositions[i * 3 + 2] = 0
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0xffcc44, size: 0.06, transparent: true, opacity: 0, sizeAttenuation: true,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    // ── Sparkling stars ──
    const starCount = 1200
    const starPos = new Float32Array(starCount * 3)
    const starSpeeds = new Float32Array(starCount)
    const starPhases = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 120
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 120
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 120
      starSpeeds[i] = 0.5 + Math.random() * 2.5
      starPhases[i] = Math.random() * Math.PI * 2
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starColors = new Float32Array(starCount * 3)
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.12, transparent: true, opacity: 1, vertexColors: true, sizeAttenuation: true,
    })
    scene.add(new THREE.Points(starGeo, starMat))

    // ── Anim state ──
    let frameId, t = 0
    let openProgress  = 0   // 0→1 opening
    let closeProgress = 0   // 0→1 closing (reassemble)
    let particleOpacity = 0
    let lightIntensity  = 0
    let particlesActivated = false
    let wishShown = false

    const state = {
      isOpening:   false,
      isClosing:   false,
      idling:      true,
      openProgress: 0,
    }

    sceneRef.current = {
      renderer, scene, camera, cubeGroup, faces,
      faceOpenRotations, faceOpenPositions,
      faceClosedRotations, faceClosedPositions, faceClosedOpacities,
      pGeo, pMat, pData,
      starGeo, starColors, starSpeeds, starPhases, starCount,
      pointLight,
      state,
      // expose reset callback so React can call it
      resetParticles: () => {
        pData.forEach(p => {
          p.active = false
          p.yBase  = -10
        })
        const pos = pGeo.attributes.position.array
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] = 0; pos[i * 3 + 1] = -10; pos[i * 3 + 2] = 0
        }
        pGeo.attributes.position.needsUpdate = true
        particleOpacity     = 0
        pMat.opacity        = 0
        particlesActivated  = false
        wishShown           = false
        lightIntensity      = 0
        openProgress        = 0
        closeProgress       = 0
      },
    }

    function animate() {
      frameId = requestAnimationFrame(animate)
      t += 0.01
      const { state: s } = sceneRef.current

      // ── Idle spin ──
      if (s.idling) {
        cubeGroup.rotation.y = Math.sin(t * 0.4) * 0.3 + t * 0.15
        cubeGroup.rotation.x = Math.sin(t * 0.25) * 0.12
      }

      // ── OPEN ──
      if (s.isOpening && openProgress < 1) {
        openProgress = Math.min(openProgress + 0.012, 1)
        const ease = openProgress * openProgress * (3 - 2 * openProgress)

        cubeGroup.rotation.y += (Math.PI * 0.25 - cubeGroup.rotation.y) * 0.06
        cubeGroup.rotation.x += (0.2 - cubeGroup.rotation.x) * 0.06

        faces.forEach((face, i) => {
          const tr = faceOpenRotations[i]
          const tp = faceOpenPositions[i]
          face.rotation.x += (tr.x - face.rotation.x) * 0.06
          face.rotation.y += (tr.y - face.rotation.y) * 0.06
          face.rotation.z += (tr.z - face.rotation.z) * 0.06
          face.position.x += (tp.x - face.position.x) * 0.06
          face.position.y += (tp.y - face.position.y) * 0.06
          face.position.z += (tp.z - face.position.z) * 0.06
          face.material.opacity += (0.04 - face.material.opacity) * 0.05
        })

        lightIntensity += (2.5 - lightIntensity) * 0.04
        pointLight.intensity = lightIntensity + Math.sin(t * 4) * 0.2

        if (ease > 0.4 && !particlesActivated) {
          particlesActivated = true
          pData.forEach(p => { p.active = true; p.yBase = -1.5 + Math.random() * 0.5 })
        }
        if (ease > 0.8 && !wishShown) {
          wishShown = true
          setWishVisible(true)
          setReplayVisible(true)
        }
        if (openProgress >= 1) s.isOpening = false
      }

      // ── CLOSE / REASSEMBLE ──
      if (s.isClosing) {
        closeProgress = Math.min(closeProgress + 0.014, 1)
        const ease = closeProgress * closeProgress * (3 - 2 * closeProgress)

        // lerp faces back to closed
        faces.forEach((face, i) => {
          const cr = faceClosedRotations[i]
          const cp = faceClosedPositions[i]
          face.rotation.x += (cr.x - face.rotation.x) * 0.07
          face.rotation.y += (cr.y - face.rotation.y) * 0.07
          face.rotation.z += (cr.z - face.rotation.z) * 0.07
          face.position.x += (cp.x - face.position.x) * 0.07
          face.position.y += (cp.y - face.position.y) * 0.07
          face.position.z += (cp.z - face.position.z) * 0.07
          face.material.opacity += (faceClosedOpacities[i] - face.material.opacity) * 0.06
        })

        // fade out light & particles
        lightIntensity   += (0 - lightIntensity)   * 0.05
        particleOpacity  += (0 - particleOpacity)  * 0.07
        pointLight.intensity = Math.max(0, lightIntensity)
        pMat.opacity         = Math.max(0, particleOpacity)

        // lerp cube group back to neutral then let idle take over
        cubeGroup.rotation.y += (0 - cubeGroup.rotation.y) * 0.04
        cubeGroup.rotation.x += (0 - cubeGroup.rotation.x) * 0.04

        // when close is done, re-enable idle
        if (closeProgress >= 1) {
          s.isClosing = false
          s.idling    = true
          t           = 0   // reset idle timer so spin restarts cleanly
        }
      }

      // ── Floating particles ──
      if (particlesActivated && !s.isClosing) {
        particleOpacity = Math.min(particleOpacity + 0.008, 0.85)
        pMat.opacity = particleOpacity
        const pos = pGeo.attributes.position.array
        pData.forEach((p, i) => {
          if (!p.active) return
          p.angle += p.speed
          p.yBase += p.riseSpeed
          if (p.yBase > 4) p.yBase = -1.5
          pos[i * 3]     = Math.cos(p.angle) * p.radius
          pos[i * 3 + 1] = p.yBase
          pos[i * 3 + 2] = Math.sin(p.angle) * p.radius
        })
        pGeo.attributes.position.needsUpdate = true
      }

      // ── Sparkle stars ──
      for (let i = 0; i < starCount; i++) {
        const b = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * starSpeeds[i] + starPhases[i]))
        starColors[i * 3]     = b
        starColors[i * 3 + 1] = b * (0.85 + 0.15 * Math.sin(t * starSpeeds[i] * 0.7))
        starColors[i * 3 + 2] = b * 0.5
      }
      starGeo.attributes.color.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    function onResize() {
      const w = window.innerWidth, h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  function openCube() {
    if (opened) return
    setOpened(true)
    setHintHidden(true)
    sceneRef.current.state.isOpening = true
    sceneRef.current.state.idling    = false
  }

  function reassemble() {
    const { state, resetParticles } = sceneRef.current
    // reset all tracking vars
    resetParticles()
    state.isOpening  = false
    state.isClosing  = true
    state.idling     = false
    // hide UI
    setWishVisible(false)
    setReplayVisible(false)
    // after close animation finishes, re-enable clicking
    setTimeout(() => {
      setOpened(false)
      setHintHidden(false)
    }, 1800)
  }

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative', cursor: opened ? 'default' : 'pointer' }}
      onClick={openCube}
    >
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

      <div className="ui-layer">
        <div className={`wish-text ${wishVisible ? 'visible' : ''}`}>
          <h1>Eid Mubarak</h1>
          <p className="sub">تَقَبَّلَ اللهُ مِنَّا وَمِنكُم</p>
          <p className="sub2">May Allah accept [the good deeds] from us and from you.</p>
        </div>
      </div>

      <div className={`click-hint ${hintHidden ? 'hidden' : ''}`}>
        click to open
      </div>

      <button
        className={`replay-btn ${replayVisible ? 'visible' : ''}`}
        onClick={e => { e.stopPropagation(); reassemble() }}
      >
        reassemble
      </button>
    </div>
  )
}