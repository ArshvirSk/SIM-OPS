"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Pause,
    Play,
    RotateCcw,
    Zap,
} from "lucide-react";
import { useState } from "react";

interface SimulationControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onReset: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    currentTime: Date;
    onTimeChange: (time: Date) => void;
    startDate: Date;
    endDate: Date;
    isLive: boolean;
}

const SPEED_OPTIONS = [
    { label: "0.5x (Slow)", value: 0.5 },
    { label: "1x (Normal)", value: 1 },
    { label: "2x (Fast)", value: 2 },
    { label: "4x (Very Fast)", value: 4 },
];

export function SimulationControls({
    isPlaying,
    onPlayPause,
    onReset,
    speed,
    onSpeedChange,
    currentTime,
    onTimeChange,
    startDate,
    endDate,
    isLive,
}: SimulationControlsProps) {
    const [isHovering, setIsHovering] = useState(false);

    const totalDays = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentDay = Math.floor(
        (currentTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const progress = (currentDay / totalDays) * 100;

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = new Date(
            startDate.getTime() + percent * (endDate.getTime() - startDate.getTime())
        );
        onTimeChange(newTime);
    };

    const handlePrevDay = () => {
        const newTime = new Date(currentTime);
        newTime.setDate(newTime.getDate() - 1);
        onTimeChange(newTime);
    };

    const handleNextDay = () => {
        const newTime = new Date(currentTime);
        newTime.setDate(newTime.getDate() + 1);
        onTimeChange(newTime);
    };

    return (
        <div className="border-2 border-border bg-card rounded-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-3 h-3 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                            }`}
                    />
                    <span className="text-sm font-mono font-semibold uppercase tracking-wide">
                        {isLive ? "LIVE MODE" : "SIMULATION MODE"}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(currentTime)} ({currentDay}/{totalDays} days)
                </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onReset}
                    title="Reset to start"
                    className="px-2"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrevDay}
                    className="px-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                    size="lg"
                    variant="default"
                    onClick={onPlayPause}
                    className="gap-2 px-6"
                >
                    {isPlaying ? (
                        <>
                            <Pause className="w-4 h-4" />
                            <span className="hidden sm:inline">PAUSE</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">PLAY</span>
                        </>
                    )}
                </Button>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextDay}
                    className="px-2"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Speed Control */}
                <Select value={speed.toString()}>
                    <SelectTrigger className="w-32 border-2">
                        <Zap className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SPEED_OPTIONS.map((option) => (
                            <SelectItem
                                key={option.value}
                                value={option.value.toString()}
                                onClick={() => onSpeedChange(option.value)}
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
                <div
                    className="relative h-2 bg-secondary rounded cursor-pointer group"
                    onClick={handleTimelineClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {/* Progress bar */}
                    <div
                        className="absolute h-full bg-foreground rounded transition-all"
                        style={{ width: `${progress}%` }}
                    />

                    {/* Hover indicator */}
                    {isHovering && (
                        <div
                            className="absolute w-4 h-4 bg-foreground rounded-full -top-1 -translate-x-2"
                            style={{ left: `${progress}%` }}
                        />
                    )}
                </div>

                {/* Labels */}
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{formatDate(startDate)}</span>
                    <span>{formatDate(endDate)}</span>
                </div>
            </div>

            {/* Info Bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold uppercase tracking-wide">
                        {isPlaying ? "Playing" : "Paused"}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Speed</p>
                    <p className="font-semibold font-mono">{speed}x</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold font-mono">{Math.round(progress)}%</p>
                </div>
            </div>
        </div>
    );
}
