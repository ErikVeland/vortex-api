/**
 * Platform-specific text utilities for consistent cross-platform behavior
 */
import { Platform } from './platform';
import { TFunction } from 'i18next';
/**
 * Interface for platform-specific text options
 */
export interface IPlatformTextOptions {
    win32?: string;
    darwin?: string;
    linux?: string;
    default?: string;
}
/**
 * Get platform-specific text with automatic platform detection
 * @param text The text to process for platform-specific variations
 * @param platform Optional platform to use instead of auto-detection
 * @returns Platform-appropriate text
 */
export declare function getPlatformText(text: string, platform?: Platform): string;
/**
 * Get platform-specific text from structured options
 * @param options Structured options for different platforms
 * @param t Translation function
 * @returns Platform-appropriate text
 */
export declare function getStructuredPlatformText(options: IPlatformTextOptions, t: TFunction): string;
/**
 * Process text with platform-specific keyboard shortcut replacements
 * @param text The text to process
 * @param t Translation function
 * @returns Platform-appropriate text with proper keyboard shortcuts
 */
export declare function processPlatformText(text: string, t: TFunction): string;
