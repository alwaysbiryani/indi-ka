"use client"

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type HTMLAttributes,
} from "react"
import { cn } from "@/utils/cn"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import React from "react";

export type WaveformProps = HTMLAttributes<HTMLDivElement> & {
    data?: number[]
    barWidth?: number
    barHeight?: number
    barGap?: number
    barRadius?: number
    barColor?: string
    fadeEdges?: boolean
    fadeWidth?: number
    height?: string | number
    active?: boolean
    onBarClick?: (index: number, value: number) => void
}

export const Waveform = React.memo(function Waveform({
    data = [],
    barWidth = 4,
    barHeight: baseBarHeight = 4,
    barGap = 2,
    barRadius = 2,
    barColor,
    fadeEdges = true,
    fadeWidth = 24,
    height = 128,
    onBarClick,
    className,
    ...props
}: WaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensionsRef = useRef({ width: 0, height: 0 })
    const colorRef = useRef<string>("#000")
    const heightStyle = typeof height === "number" ? `${height}px` : height
    const step = useMemo(() => barWidth + barGap, [barWidth, barGap])

    const renderWaveform = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const { width, height } = dimensionsRef.current
        if (width <= 0 || height <= 0) return
        ctx.clearRect(0, 0, width, height)

        const barCount = Math.floor(width / step)
        if (barCount <= 0) return
        const centerY = height / 2

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * data.length)
                const value = data[dataIndex] || 0
                const barHeight = Math.max(baseBarHeight, value * height * 0.8)
                const x = i * step
                const y = centerY - barHeight / 2

                ctx.fillStyle = colorRef.current
                ctx.globalAlpha = 0.3 + value * 0.7

                if (barRadius > 0) {
                    ctx.beginPath()
                    ctx.roundRect(x, y, barWidth, barHeight, barRadius)
                    ctx.fill()
                } else {
                    ctx.fillRect(x, y, barWidth, barHeight)
                }
            }

            ctx.globalAlpha = 1
    }, [barRadius, barWidth, baseBarHeight, data, step])

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const updateColor = () => {
            colorRef.current =
                barColor ||
                getComputedStyle(canvas).getPropertyValue("--foreground").trim() ||
                "#000"
        }

        const updateDimensions = () => {
            const rect = container.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            }
            dimensionsRef.current = { width: rect.width, height: rect.height }
        }

        const resizeObserver = new ResizeObserver(() => {
            updateDimensions()
            updateColor()
            renderWaveform()
        })

        const themeObserver = new MutationObserver(() => {
            updateColor()
            renderWaveform()
        })
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
        })
        const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleThemeMediaChange = () => {
            updateColor()
            renderWaveform()
        }
        darkModeQuery.addEventListener("change", handleThemeMediaChange)

        resizeObserver.observe(container)
        updateDimensions()
        updateColor()
        renderWaveform()
        return () => {
            resizeObserver.disconnect()
            themeObserver.disconnect()
            darkModeQuery.removeEventListener("change", handleThemeMediaChange)
        }
    }, [
        barColor,
        renderWaveform,
    ])

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onBarClick) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const barIndex = Math.floor(x / (barWidth + barGap))
        const dataIndex = Math.floor(
            (barIndex * data.length) / Math.floor(rect.width / (barWidth + barGap))
        )
        if (dataIndex >= 0 && dataIndex < data.length) {
            onBarClick(dataIndex, data[dataIndex])
        }
    }

    const maskStyle = fadeEdges && fadeWidth > 0
        ? { maskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`, WebkitMaskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)` }
        : undefined

    return (
        <div
            className={cn("relative", className)}
            ref={containerRef}
            style={{ height: heightStyle, ...maskStyle }}
            {...props}
        >
            <canvas
                className="block h-full w-full"
                onClick={handleClick}
                ref={canvasRef}
            />
        </div>
    )
});

export type ScrollingWaveformProps = Omit<
    WaveformProps,
    "data" | "onBarClick"
> & {
    speed?: number
    barCount?: number
    data?: number[]
}

export const ScrollingWaveform = ({
    speed = 50,
    barCount = 60,
    barWidth = 4,
    barHeight: baseBarHeight = 4,
    barGap = 2,
    barRadius = 2,
    barColor,
    fadeEdges = true,
    fadeWidth = 24,
    height = 128,
    data,
    className,
    ...props
}: ScrollingWaveformProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const barsRef = useRef<Array<{ x: number; height: number }>>([])
    const headRef = useRef(0)
    const countRef = useRef(0)
    const animationRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const seedRef = useRef(0)
    const driftRef = useRef(0)
    const generatedIndexRef = useRef(0)
    const metricsRef = useRef({ width: 0, height: 0, color: "#000" })
    useEffect(() => {
        seedRef.current = Math.random()
    }, [])
    const dataIndexRef = useRef(0)
    const isVisible = useIntersectionObserver(canvasRef)
    const isMobile = useIsMobile()
    const lastFrameTimeRef = useRef<number>(0)
    const step = useMemo(() => barWidth + barGap, [barWidth, barGap])

    const heightStyle = typeof height === "number" ? `${height}px` : height

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const updateColor = () => {
            metricsRef.current.color =
                barColor ||
                getComputedStyle(canvas).getPropertyValue("--foreground").trim() ||
                "#000"
        }

        const ensureCapacity = (nextCapacity: number) => {
            if (barsRef.current.length >= nextCapacity) return
            const oldBuffer = barsRef.current
            const oldLength = oldBuffer.length
            const newBufferLength = Math.max(nextCapacity, oldLength * 2, 16)
            const newBuffer = Array.from({ length: newBufferLength }, () => ({
                x: 0,
                height: 0,
            }))
            for (let i = 0; i < countRef.current; i++) {
                const oldIndex = (headRef.current + i) % Math.max(oldLength, 1)
                newBuffer[i] = oldBuffer[oldIndex] || { x: 0, height: 0 }
            }
            barsRef.current = newBuffer
            headRef.current = 0
        }

        const resetBarsForWidth = (width: number) => {
            const desiredBars = Math.max(barCount * 2, Math.ceil(width / step) + 4)
            ensureCapacity(desiredBars)
            headRef.current = 0
            countRef.current = 0
            let currentX = width
            while (currentX > -step && countRef.current < barsRef.current.length) {
                const idx = (headRef.current + countRef.current) % barsRef.current.length
                const seeded = Math.sin(seedRef.current * 10000 + generatedIndexRef.current) * 10000
                const random = seeded - Math.floor(seeded)
                barsRef.current[idx] = {
                    x: currentX,
                    height: 0.2 + random * 0.6,
                }
                countRef.current += 1
                generatedIndexRef.current += 1
                currentX -= step
            }
        }

        const updateDimensions = () => {
            const rect = container.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            }
            metricsRef.current.width = rect.width
            metricsRef.current.height = rect.height

            resetBarsForWidth(rect.width)
        }

        const resizeObserver = new ResizeObserver(() => {
            updateDimensions()
            updateColor()
        })

        const themeObserver = new MutationObserver(updateColor)
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
        })
        const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
        darkModeQuery.addEventListener("change", updateColor)

        resizeObserver.observe(container)
        updateDimensions()
        updateColor()
        return () => {
            resizeObserver.disconnect()
            themeObserver.disconnect()
            darkModeQuery.removeEventListener("change", updateColor)
        }
    }, [barColor, barCount, step])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const targetFps = isMobile ? 30 : 60
        const frameInterval = 1000 / targetFps

        const animate = (currentTime: number) => {
            if (!isVisible) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }

            const elapsedSinceLastFrame = currentTime - lastFrameTimeRef.current
            if (elapsedSinceLastFrame < frameInterval) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }

            lastFrameTimeRef.current = currentTime - (elapsedSinceLastFrame % frameInterval)

            const deltaTime = lastTimeRef.current
                ? (currentTime - lastTimeRef.current) / 1000
                : 0
            lastTimeRef.current = currentTime
            driftRef.current += deltaTime * 0.01

            const { width, height, color } = metricsRef.current
            if (width <= 0 || height <= 0 || barsRef.current.length === 0) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }
            ctx.clearRect(0, 0, width, height)

            for (let i = 0; i < countRef.current; i++) {
                const idx = (headRef.current + i) % barsRef.current.length
                barsRef.current[idx].x -= speed * deltaTime
            }

            while (countRef.current > 0) {
                const headBar = barsRef.current[headRef.current]
                if (headBar.x + barWidth > -step) break
                headRef.current = (headRef.current + 1) % barsRef.current.length
                countRef.current -= 1
            }

            while (
                countRef.current === 0 ||
                barsRef.current[(headRef.current + countRef.current - 1) % barsRef.current.length].x < width
            ) {
                if (countRef.current >= barsRef.current.length) break
                const lastBar =
                    countRef.current > 0
                        ? barsRef.current[(headRef.current + countRef.current - 1) % barsRef.current.length]
                        : null
                const nextX = lastBar ? lastBar.x + step : width
                let newHeight: number

                if (data && data.length > 0) {
                    newHeight = data[dataIndexRef.current % data.length] || 0.1
                    dataIndexRef.current = (dataIndexRef.current + 1) % data.length
                } else {
                    const uniqueIndex = generatedIndexRef.current + driftRef.current
                    const seededValue =
                        Math.sin(seedRef.current * 10000 + uniqueIndex * 137.5) * 10000
                    const randomComponent = (seededValue - Math.floor(seededValue)) * 0.4
                    const wave1 = Math.sin(uniqueIndex * 0.1) * 0.2
                    const wave2 = Math.cos(uniqueIndex * 0.05) * 0.15
                    newHeight = Math.max(
                        0.1,
                        Math.min(0.9, 0.3 + wave1 + wave2 + randomComponent)
                    )
                    generatedIndexRef.current += 1
                }

                const insertIndex = (headRef.current + countRef.current) % barsRef.current.length
                barsRef.current[insertIndex] = {
                    x: nextX,
                    height: newHeight,
                }
                countRef.current += 1
            }

            const centerY = height / 2
            for (let i = 0; i < countRef.current; i++) {
                const bar = barsRef.current[(headRef.current + i) % barsRef.current.length]
                if (bar.x < width && bar.x + barWidth > 0) {
                    const barHeight = Math.max(
                        baseBarHeight,
                        bar.height * height * 0.6
                    )
                    const y = centerY - barHeight / 2

                    ctx.fillStyle = color
                    ctx.globalAlpha = 0.3 + bar.height * 0.7

                    if (barRadius > 0) {
                        ctx.beginPath()
                        ctx.roundRect(bar.x, y, barWidth, barHeight, barRadius)
                        ctx.fill()
                    } else {
                        ctx.fillRect(bar.x, y, barWidth, barHeight)
                    }
                }
            }

            ctx.globalAlpha = 1
            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        speed,
        barCount,
        barWidth,
        baseBarHeight,
        barGap,
        barRadius,
        fadeEdges,
        fadeWidth,
        step,
        data,
        isMobile,
        isVisible
    ])

    const scrollMaskStyle = fadeEdges && fadeWidth > 0
        ? { maskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)`, WebkitMaskImage: `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)` }
        : undefined

    return (
        <div
            className={cn("relative flex items-center", className)}
            ref={containerRef}
            style={{ height: heightStyle, ...scrollMaskStyle }}
            {...props}
        >
            <canvas className="block h-full w-full" ref={canvasRef} />
        </div>
    )
}

export type AudioScrubberProps = WaveformProps & {
    currentTime?: number
    duration?: number
    onSeek?: (time: number) => void
    showHandle?: boolean
}

export const AudioScrubber = ({
    data = [],
    currentTime = 0,
    duration = 100,
    onSeek,
    showHandle = true,
    barWidth = 3,
    barHeight,
    barGap = 1,
    barRadius = 1,
    barColor,
    height = 128,
    className,
    ...props
}: AudioScrubberProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const [localProgress, setLocalProgress] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const waveformData = useMemo(
        () => (data.length > 0
            ? data
            : Array.from({ length: 100 }, (_, i) => {
                const seeded = Math.sin((i + 1) * 12.9898) * 43758.5453
                const normalized = seeded - Math.floor(seeded)
                return 0.2 + normalized * 0.6
            })),
        [data]
    )

    const displayProgress = isDragging
        ? localProgress
        : (duration > 0 ? currentTime / duration : 0)

    const handleScrub = useCallback(
        (clientX: number) => {
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
            const progress = x / rect.width
            const newTime = progress * duration
            setLocalProgress(progress)
            onSeek?.(newTime)
        },
        [duration, onSeek]
    )

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
        handleScrub(e.clientX)
    }

    useEffect(() => {
        if (!isDragging) return
        const handleMouseMove = (e: MouseEvent) => {
            handleScrub(e.clientX)
        }
        const handleMouseUp = () => {
            setIsDragging(false)
        }
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, duration, handleScrub])

    const heightStyle = typeof height === "number" ? `${height}px` : height

    return (
        <div
            aria-label="Audio waveform scrubber"
            aria-valuemax={duration}
            aria-valuemin={0}
            aria-valuenow={currentTime}
            className={cn("relative cursor-pointer select-none", className)}
            onMouseDown={handleMouseDown}
            ref={containerRef}
            role="slider"
            style={{ height: heightStyle }}
            tabIndex={0}
            {...props}
        >
            <Waveform
                barColor={barColor}
                barGap={barGap}
                barRadius={barRadius}
                barWidth={barWidth}
                barHeight={barHeight}
                data={waveformData}
                fadeEdges={false}
            />
            <div
                className="bg-primary/20 pointer-events-none absolute inset-y-0 left-0"
                style={{ width: `${displayProgress * 100}%` }}
            />
            <div
                className="bg-primary pointer-events-none absolute top-0 bottom-0 w-0.5"
                style={{ left: `${displayProgress * 100}%` }}
            />
            {showHandle && (
                <div
                    className="border-background bg-primary pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg transition-transform hover:scale-110"
                    style={{ left: `${displayProgress * 100}%` }}
                />
            )}
        </div>
    )
}

export type MicrophoneWaveformProps = WaveformProps & {
    active?: boolean
    processing?: boolean
    fftSize?: number
    smoothingTimeConstant?: number
    sensitivity?: number
    onError?: (error: Error) => void
}

export const MicrophoneWaveform = ({
    active = false,
    processing = false,
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    sensitivity = 1,
    onError,
    ...props
}: MicrophoneWaveformProps) => {
    const [data, setData] = useState<number[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const isVisibleInViewport = useIntersectionObserver(containerRef)
    const isMobile = useIsMobile()
    const lastFrameTimeRef = useRef<number>(0)

    const analyserRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const processingAnimationRef = useRef<number | null>(null)
    const lastActiveDataRef = useRef<number[]>([])
    const transitionProgressRef = useRef(0)

    useEffect(() => {
        if (processing && !active) {
            let time = 0
            transitionProgressRef.current = 0
            const targetFps = isMobile ? 30 : 60
            const frameInterval = 1000 / targetFps

            const animateProcessing = (now: number) => {
                if (!isVisibleInViewport) {
                    processingAnimationRef.current = requestAnimationFrame(animateProcessing)
                    return
                }

                const elapsed = now - lastFrameTimeRef.current
                if (elapsed < frameInterval) {
                    processingAnimationRef.current = requestAnimationFrame(animateProcessing)
                    return
                }
                lastFrameTimeRef.current = now - (elapsed % frameInterval)

                time += 0.03
                transitionProgressRef.current = Math.min(
                    1,
                    transitionProgressRef.current + 0.02
                )
                const processingData = []
                const barCount = 45
                for (let i = 0; i < barCount; i++) {
                    const normalizedPosition = (i - barCount / 2) / (barCount / 2)
                    const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4
                    const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25
                    const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2
                    const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15
                    const combinedWave = wave1 + wave2 + wave3
                    const processingValue = (0.2 + combinedWave) * centerWeight

                    let finalValue = processingValue
                    if (
                        lastActiveDataRef.current.length > 0 &&
                        transitionProgressRef.current < 1
                    ) {
                        const lastDataIndex = Math.floor(
                            (i / barCount) * lastActiveDataRef.current.length
                        )
                        const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
                        finalValue =
                            lastValue * (1 - transitionProgressRef.current) +
                            processingValue * transitionProgressRef.current
                    }
                    processingData.push(Math.max(0.05, Math.min(1, finalValue)))
                }
                setData(processingData)
                processingAnimationRef.current =
                    requestAnimationFrame(animateProcessing)
            }
            processingAnimationRef.current = requestAnimationFrame(animateProcessing)
            return () => {
                if (processingAnimationRef.current) {
                    cancelAnimationFrame(processingAnimationRef.current)
                }
            }
        } else if (!active && !processing) {
            if (data.length > 0) {
                let fadeProgress = 0
                const fadeToIdle = () => {
                    fadeProgress += 0.03
                    if (fadeProgress < 1) {
                        const fadedData = data.map((value) => value * (1 - fadeProgress))
                        setData(fadedData)
                        requestAnimationFrame(fadeToIdle)
                    } else {
                        setData([])
                    }
                }
                fadeToIdle()
            }
            return
        }
    }, [processing, active, isMobile, isVisibleInViewport, data])

    useEffect(() => {
        if (!active) {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }
            if (
                audioContextRef.current &&
                audioContextRef.current.state !== "closed"
            ) {
                audioContextRef.current.close()
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            return
        }

        const setupMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                })
                streamRef.current = stream
                const audioContext = new (window.AudioContext ||
                    (window as unknown as { webkitAudioContext: typeof AudioContext })
                        .webkitAudioContext)()
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = fftSize
                analyser.smoothingTimeConstant = smoothingTimeConstant
                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)
                audioContextRef.current = audioContext
                analyserRef.current = analyser

                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                const targetFps = isMobile ? 30 : 60
                const frameInterval = 1000 / targetFps

                const updateData = (now: number) => {
                    if (!analyserRef.current || !active) return

                    if (!isVisibleInViewport) {
                        animationIdRef.current = requestAnimationFrame(updateData)
                        return
                    }

                    const elapsed = now - lastFrameTimeRef.current
                    if (elapsed < frameInterval) {
                        animationIdRef.current = requestAnimationFrame(updateData)
                        return
                    }
                    lastFrameTimeRef.current = now - (elapsed % frameInterval)

                    analyserRef.current.getByteFrequencyData(dataArray)

                    const startFreq = Math.floor(dataArray.length * 0.05)
                    const endFreq = Math.floor(dataArray.length * 0.4)
                    const relevantData = dataArray.slice(startFreq, endFreq)

                    const halfLength = Math.floor(relevantData.length / 2)
                    const normalizedData = []

                    for (let i = halfLength - 1; i >= 0; i--) {
                        const value = Math.min(1, (relevantData[i] / 255) * sensitivity)
                        normalizedData.push(value)
                    }
                    for (let i = 0; i < halfLength; i++) {
                        const value = Math.min(1, (relevantData[i] / 255) * sensitivity)
                        normalizedData.push(value)
                    }

                    setData(normalizedData)
                    lastActiveDataRef.current = normalizedData
                    animationIdRef.current = requestAnimationFrame(updateData)
                }
                animationIdRef.current = requestAnimationFrame(updateData)
            } catch (error) {
                onError?.(error as Error)
            }
        }

        setupMicrophone()
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }
            if (
                audioContextRef.current &&
                audioContextRef.current.state !== "closed"
            ) {
                audioContextRef.current.close()
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
        }
    }, [active, fftSize, smoothingTimeConstant, sensitivity, onError, isMobile, isVisibleInViewport])

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <Waveform data={data} {...props} />
        </div>
    )
}

export const CircularMicrophoneWaveform = ({
    active = false,
    processing = false,
    size = 200,
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    sensitivity = 1,
    color = "#ffffff",
    onError,
    className,
}: MicrophoneWaveformProps & { size?: number; color?: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const amplitudeRef = useRef(0)
    const isVisible = useIntersectionObserver(canvasRef)
    const isMobile = useIsMobile()
    const lastFrameTimeRef = useRef<number>(0)

    useEffect(() => {
        if (!active) {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
            if (audioContextRef.current) audioContextRef.current.close()
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
            amplitudeRef.current = 0
            return
        }

        const setupMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                streamRef.current = stream
                const AudioContextClass = (window.AudioContext ||
                    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
                if (!AudioContextClass) {
                    throw new Error("AudioContext not supported");
                }
                const audioContext = new AudioContextClass()
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = fftSize
                analyser.smoothingTimeConstant = smoothingTimeConstant
                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)
                audioContextRef.current = audioContext
                analyserRef.current = analyser

                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                const canvas = canvasRef.current
                if (!canvas) return
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                const dpr = window.devicePixelRatio || 1
                canvas.width = size * dpr
                canvas.height = size * dpr
                ctx.scale(dpr, dpr)

                const targetFps = isMobile ? 30 : 60
                const frameInterval = 1000 / targetFps
                let time = 0

                const redraw = (now: number) => {
                    if (!isVisible) {
                        animationIdRef.current = requestAnimationFrame(redraw)
                        return
                    }

                    const elapsedSinceLastFrame = now - lastFrameTimeRef.current
                    if (elapsedSinceLastFrame < frameInterval) {
                        animationIdRef.current = requestAnimationFrame(redraw)
                        return
                    }

                    lastFrameTimeRef.current = now - (elapsedSinceLastFrame % frameInterval)

                    // Get audio data
                    analyser.getByteFrequencyData(dataArray)
                    let sum = 0
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
                    amplitudeRef.current = (sum / dataArray.length) / 255 * sensitivity

                    // Render
                    time += 0.05
                    ctx.clearRect(0, 0, size, size)
                    const cx = size / 2
                    const cy = size / 2
                    const baseRadius = size * 0.35
                    const amplitude = amplitudeRef.current

                    for (let i = 0; i < 3; i++) {
                        const layerAmplitude = amplitude * (1 - i * 0.2)
                        const layerTime = time + i * 2

                        ctx.beginPath()
                        ctx.strokeStyle = color
                        ctx.lineWidth = 2
                        ctx.globalAlpha = 0.2 / (i + 1)

                        if (active || processing) {
                            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                                const noise = Math.sin(angle * 4 + layerTime) * 10 * layerAmplitude
                                const r = baseRadius + noise + (Math.sin(angle * 8 - layerTime * 0.5) * 5 * layerAmplitude)
                                const x = cx + Math.cos(angle) * r
                                const y = cy + Math.sin(angle) * r
                                if (angle === 0) ctx.moveTo(x, y)
                                else ctx.lineTo(x, y)
                            }
                            ctx.closePath()
                            ctx.stroke()
                            ctx.globalAlpha = 0.05 * layerAmplitude
                            ctx.fill()
                        } else {
                            ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
                            ctx.stroke()
                        }
                    }

                    ctx.globalAlpha = 0.8
                    ctx.beginPath()
                    ctx.fillStyle = color
                    const corePulse = (active || processing) ? (1 + amplitude * 0.2) : 1
                    ctx.arc(cx, cy, baseRadius * 0.8 * corePulse, 0, Math.PI * 2)
                    ctx.fill()

                    animationIdRef.current = requestAnimationFrame(redraw)
                }
                animationIdRef.current = requestAnimationFrame(redraw)
            } catch (err) {
                onError?.(err as Error)
            }
        }
        setupMicrophone()
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
            if (audioContextRef.current) audioContextRef.current.close()
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        }
    }, [active, processing, size, fftSize, smoothingTimeConstant, sensitivity, color, onError, isVisible, isMobile])

    return (
        <canvas
            ref={canvasRef}
            className={cn("block", className)}
            style={{ width: size, height: size }}
        />
    )
}

export const SimpleScrollingWaveform = ({
    active = false,
    barWidth = 2,
    barGap = 2,
    color = "#ffffff",
    height = 40,
    sensitivity = 1.5,
    mediaStream,
    className,
    ...props
}: {
    active?: boolean;
    barWidth?: number;
    barGap?: number;
    color?: string;
    height?: number;
    sensitivity?: number;
    mediaStream?: MediaStream | null;
} & HTMLAttributes<HTMLCanvasElement>) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const historyRef = useRef<number[]>([])
    const isVisible = useIntersectionObserver(canvasRef)
    const isMobile = useIsMobile()
    const lastFrameTimeRef = useRef<number>(0)

    useEffect(() => {
        if (!active) {
            // Only stop tracks if we created the stream locally
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop())
                localStreamRef.current = null
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error)
                audioContextRef.current = null
            }
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
            historyRef.current = []
            return
        }

        const setup = async () => {
            try {
                let stream: MediaStream
                if (mediaStream) {
                    stream = mediaStream
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                    localStreamRef.current = stream
                }

                const AudioContextClass =
                    window.AudioContext ||
                    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
                if (!AudioContextClass) {
                    throw new Error("AudioContext not supported")
                }
                const audioContext = new AudioContextClass()
                const analyser = audioContext.createAnalyser()
                analyser.fftSize = 256
                const source = audioContext.createMediaStreamSource(stream)
                source.connect(analyser)
                audioContextRef.current = audioContext
                analyserRef.current = analyser

                const dataArray = new Uint8Array(analyser.frequencyBinCount)
                const targetFps = isMobile ? 30 : 60
                const frameInterval = 1000 / targetFps

                const update = (now: number) => {
                    if (!isVisible) {
                        animationIdRef.current = requestAnimationFrame(update)
                        return
                    }

                    const elapsed = now - lastFrameTimeRef.current
                    if (elapsed < frameInterval) {
                        animationIdRef.current = requestAnimationFrame(update)
                        return
                    }

                    lastFrameTimeRef.current = now - (elapsed % frameInterval)

                    analyser.getByteFrequencyData(dataArray)
                    let sum = 0
                    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
                    const avg = (sum / dataArray.length) / 255 * sensitivity

                    historyRef.current.push(avg)

                    const canvas = canvasRef.current
                    if (canvas) {
                        const dpr = window.devicePixelRatio || 1
                        const width = canvas.width / dpr
                        const maxBars = Math.ceil(width / (barWidth + barGap))
                        if (historyRef.current.length > maxBars) {
                            historyRef.current.shift()
                        }
                        draw(canvas, historyRef.current)
                    }

                    animationIdRef.current = requestAnimationFrame(update)
                }

                animationIdRef.current = requestAnimationFrame(update)
            } catch (err) {
                console.error("Microphone access failed", err)
            }
        }

        const draw = (canvas: HTMLCanvasElement, history: number[]) => {
            const ctx = canvas.getContext('2d', { alpha: true }) // Hint for transparency optimization
            if (!ctx) return

            const dpr = window.devicePixelRatio || 1
            const width = canvas.width / dpr
            const height = canvas.height / dpr

            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = color

            const step = barWidth + barGap
            const centerY = height / 2

            // Batch draw calls if possible or keep as is for simplicity
            // Optimization: Skip off-screen bars
            const startIndex = Math.max(0, history.length - Math.ceil(width / step))

            ctx.beginPath()
            for (let i = startIndex; i < history.length; i++) {
                const val = history[i]
                const x = width - (history.length - i) * step
                // Safety check
                if (x + barWidth < 0) continue

                const h = Math.max(1, val * height * 0.9)
                ctx.rect(x, centerY - h / 2, barWidth, h)
            }
            ctx.fill()
        }

        setup()

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop())
                localStreamRef.current = null
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error)
                audioContextRef.current = null
            }
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
        }
    }, [active, barWidth, barGap, color, sensitivity, mediaStream, isMobile, isVisible])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return
            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className={cn("w-full block opacity-60", className)}
            style={{ height }}
            {...props}
        />
    )
}
