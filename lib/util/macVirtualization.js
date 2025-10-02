"use strict";
/**
 * macOS virtualization detection utilities for Crossover, Parallels, VMware, and VirtualBox
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWindowsDrivePaths = exports.getVirtualBoxWindowsDrives = exports.getVMwareWindowsDrives = exports.getParallelsWindowsDrives = exports.getCrossoverWindowsDrives = exports.getVirtualBoxPaths = exports.getVMwarePaths = exports.getParallelsPaths = exports.getCrossoverPaths = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const log_1 = require("./log");
const platform_1 = require("./platform");
/**
 * Check if Crossover is installed and get its bottle paths
 */
function getCrossoverPaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = (0, platform_1.getHomeDirectory)();
        if (!homeDir) {
            return [];
        }
        // Common Crossover installation paths
        const crossoverPaths = [
            path.join(homeDir, 'Applications', 'Crossover'),
            '/Applications/CrossOver.app', // System installation
        ];
        const bottlePaths = [];
        // Check if Crossover is installed
        for (const crossoverPath of crossoverPaths) {
            try {
                if (yield fs.pathExists(crossoverPath)) {
                    // Crossover bottles are typically stored in ~/Library/Application Support/CrossOver/Bottles
                    const bottlesPath = path.join(homeDir, 'Library', 'Application Support', 'CrossOver', 'Bottles');
                    if (yield fs.pathExists(bottlesPath)) {
                        const bottles = yield fs.readdir(bottlesPath);
                        for (const bottle of bottles) {
                            const bottlePath = path.join(bottlesPath, bottle);
                            bottlePaths.push(bottlePath);
                        }
                    }
                    break;
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check Crossover installation', { path: crossoverPath, error: err.message });
            }
        }
        return bottlePaths;
    });
}
exports.getCrossoverPaths = getCrossoverPaths;
/**
 * Check if Parallels is installed and get its VM paths
 */
function getParallelsPaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = (0, platform_1.getHomeDirectory)();
        if (!homeDir) {
            return [];
        }
        // Common Parallels installation paths
        const parallelsPaths = [
            path.join(homeDir, 'Applications', 'Parallels'),
            path.join(homeDir, 'Documents', 'Parallels'),
            '/Applications/Parallels Desktop.app', // System installation
        ];
        const vmPaths = [];
        // Check if Parallels is installed
        for (const parallelsPath of parallelsPaths) {
            try {
                if (yield fs.pathExists(parallelsPath)) {
                    // Parallels VMs are typically stored in ~/Parallels
                    const userVMsPath = path.join(homeDir, 'Parallels');
                    if (yield fs.pathExists(userVMsPath)) {
                        const vms = yield fs.readdir(userVMsPath);
                        for (const vm of vms) {
                            if (vm.endsWith('.pvm')) { // Parallels VM files
                                const vmPath = path.join(userVMsPath, vm);
                                vmPaths.push(vmPath);
                            }
                        }
                    }
                    break;
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check Parallels installation', { path: parallelsPath, error: err.message });
            }
        }
        return vmPaths;
    });
}
exports.getParallelsPaths = getParallelsPaths;
/**
 * Check if VMware Fusion is installed and get its VM paths
 */
function getVMwarePaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = (0, platform_1.getHomeDirectory)();
        if (!homeDir) {
            return [];
        }
        // Common VMware Fusion installation paths (checked but not required for VM discovery)
        const vmwareInstallPaths = [
            '/Applications/VMware Fusion.app',
            path.join(homeDir, 'Applications/VMware Fusion.app'), // User installation
        ];
        const vmPaths = [];
        // Probe installation paths (for logging/diagnostics only)
        for (const installPath of vmwareInstallPaths) {
            try {
                // Intentionally ignore the result; existence of the app bundle isn't required
                yield fs.pathExists(installPath);
            }
            catch (_a) {
                // ignore
            }
        }
        // Primary VM location: ~/Documents/Virtual Machines
        const primaryVMsPath = path.join(homeDir, 'Documents', 'Virtual Machines');
        try {
            if (yield fs.pathExists(primaryVMsPath)) {
                const vms = yield fs.readdir(primaryVMsPath);
                for (const vm of vms) {
                    if (vm.endsWith('.vmwarevm')) {
                        vmPaths.push(path.join(primaryVMsPath, vm));
                    }
                }
            }
        }
        catch (err) {
            (0, log_1.log)('debug', 'Failed to read primary VMware VMs directory', { path: primaryVMsPath, error: err.message });
        }
        // Fallback/legacy VM location: ~/Virtual Machines
        if (vmPaths.length === 0) {
            const legacyVMsPath = path.join(homeDir, 'Virtual Machines');
            try {
                // Try reading directly; don't gate on pathExists to improve resilience
                const vms = yield fs.readdir(legacyVMsPath);
                for (const vm of vms) {
                    if (vm.endsWith('.vmwarevm')) {
                        vmPaths.push(path.join(legacyVMsPath, vm));
                    }
                }
            }
            catch (err) {
                // If readdir fails, log and continue
                (0, log_1.log)('debug', 'Failed to read legacy VMware VMs directory', { path: legacyVMsPath, error: err.message });
            }
        }
        return vmPaths;
    });
}
exports.getVMwarePaths = getVMwarePaths;
/**
 * Check if VirtualBox is installed and get its VM paths
 */
function getVirtualBoxPaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const homeDir = (0, platform_1.getHomeDirectory)();
        if (!homeDir) {
            return [];
        }
        // Common VirtualBox installation paths
        const virtualBoxPaths = [
            '/Applications/VirtualBox.app',
            path.join(homeDir, 'Applications/VirtualBox.app'), // User installation
        ];
        const vmPaths = [];
        // Check if VirtualBox is installed
        for (const virtualBoxPath of virtualBoxPaths) {
            try {
                if (yield fs.pathExists(virtualBoxPath)) {
                    // VirtualBox VMs are typically stored in ~/VirtualBox VMs
                    const userVMsPath = path.join(homeDir, 'VirtualBox VMs');
                    if (yield fs.pathExists(userVMsPath)) {
                        const vms = yield fs.readdir(userVMsPath);
                        for (const vm of vms) {
                            const vmPath = path.join(userVMsPath, vm);
                            vmPaths.push(vmPath);
                        }
                    }
                    break;
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check VirtualBox installation', { path: virtualBoxPath, error: err.message });
            }
        }
        return vmPaths;
    });
}
exports.getVirtualBoxPaths = getVirtualBoxPaths;
/**
 * Get Windows drive paths from Crossover bottles
 */
function getCrossoverWindowsDrives() {
    return __awaiter(this, void 0, void 0, function* () {
        const bottlePaths = yield getCrossoverPaths();
        const windowsDrives = [];
        for (const bottlePath of bottlePaths) {
            try {
                // In Crossover, Windows drives are typically mounted under the bottle directory
                const driveCPath = path.join(bottlePath, 'drive_c');
                if (yield fs.pathExists(driveCPath)) {
                    windowsDrives.push(driveCPath);
                }
                // Check for other drives
                const drives = ['drive_d', 'drive_e', 'drive_f'];
                for (const drive of drives) {
                    const drivePath = path.join(bottlePath, drive);
                    if (yield fs.pathExists(drivePath)) {
                        windowsDrives.push(drivePath);
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to get Crossover Windows drives', { bottlePath, error: err.message });
            }
        }
        return windowsDrives;
    });
}
exports.getCrossoverWindowsDrives = getCrossoverWindowsDrives;
/**
 * Get Windows drive paths from Parallels VMs
 * Note: This is a simplified approach as accessing Parallels VM filesystems
 * requires mounting or special tools
 */
function getParallelsWindowsDrives() {
    return __awaiter(this, void 0, void 0, function* () {
        const vmPaths = yield getParallelsPaths();
        const windowsDrives = [];
        // Include the global Parallels "Shared Folders" directory under ~/Parallels
        try {
            const homeDir = (0, platform_1.getHomeDirectory)();
            if (homeDir) {
                const globalShared = path.join(homeDir, 'Parallels', 'Shared Folders');
                if (yield fs.pathExists(globalShared)) {
                    windowsDrives.push(globalShared);
                }
            }
        }
        catch (err) {
            (0, log_1.log)('debug', 'Failed to get global Parallels shared folders', { error: err.message });
        }
        for (const vmPath of vmPaths) {
            try {
                // In Parallels, per-vm shared folders may exist inside the .pvm bundle
                const sharedFolder = path.join(vmPath, 'Shared Folders');
                if (yield fs.pathExists(sharedFolder)) {
                    windowsDrives.push(sharedFolder);
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to get Parallels Windows drives', { vmPath, error: err.message });
            }
        }
        return windowsDrives;
    });
}
exports.getParallelsWindowsDrives = getParallelsWindowsDrives;
/**
 * Get Windows drive paths from VMware VMs
 */
function getVMwareWindowsDrives() {
    return __awaiter(this, void 0, void 0, function* () {
        const vmPaths = yield getVMwarePaths();
        const windowsDrives = [];
        for (const vmPath of vmPaths) {
            try {
                // VMware shared folders are typically accessible
                const sharedFolder = path.join(vmPath, 'Shared Folders');
                if (yield fs.pathExists(sharedFolder)) {
                    windowsDrives.push(sharedFolder);
                }
                // Also check for mounted VM filesystems
                const vmName = path.basename(vmPath, '.vmwarevm');
                const mountedPath = path.join('/Volumes', vmName);
                if (yield fs.pathExists(mountedPath)) {
                    windowsDrives.push(mountedPath);
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to get VMware Windows drives', { vmPath, error: err.message });
            }
        }
        return windowsDrives;
    });
}
exports.getVMwareWindowsDrives = getVMwareWindowsDrives;
/**
 * Get Windows drive paths from VirtualBox VMs
 */
function getVirtualBoxWindowsDrives() {
    return __awaiter(this, void 0, void 0, function* () {
        const vmPaths = yield getVirtualBoxPaths();
        const windowsDrives = [];
        for (const vmPath of vmPaths) {
            try {
                // VirtualBox shared folders
                const sharedFolder = path.join(vmPath, 'SharedFolder');
                if (yield fs.pathExists(sharedFolder)) {
                    windowsDrives.push(sharedFolder);
                }
                // Check for mounted VM filesystems
                const vmName = path.basename(vmPath);
                const mountedPath = path.join('/Volumes', vmName);
                if (yield fs.pathExists(mountedPath)) {
                    windowsDrives.push(mountedPath);
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to get VirtualBox Windows drives', { vmPath, error: err.message });
            }
        }
        return windowsDrives;
    });
}
exports.getVirtualBoxWindowsDrives = getVirtualBoxWindowsDrives;
/**
 * Get all Windows-compatible drive paths on macOS
 * This includes:
 * 1. Native macOS drives (for native Windows games through tools like Porting Kit)
 * 2. Crossover bottle drives
 * 3. Parallels VM shared folders
 * 4. VMware VM shared folders
 * 5. VirtualBox VM shared folders
 */
function getAllWindowsDrivePaths() {
    return __awaiter(this, void 0, void 0, function* () {
        const drivePaths = [];
        try {
            // 1. Add standard macOS drives that might contain Windows games
            drivePaths.push('/'); // Root filesystem
            // 2. Add Crossover Windows drives
            const crossoverDrives = yield getCrossoverWindowsDrives();
            drivePaths.push(...crossoverDrives);
            // 3. Add Parallels shared folders
            const parallelsDrives = yield getParallelsWindowsDrives();
            drivePaths.push(...parallelsDrives);
            // 4. Add VMware shared folders
            const vmwareDrives = yield getVMwareWindowsDrives();
            drivePaths.push(...vmwareDrives);
            // 5. Add VirtualBox shared folders
            const virtualboxDrives = yield getVirtualBoxWindowsDrives();
            drivePaths.push(...virtualboxDrives);
            // 6. Add common external drive mount points where Windows games might be installed
            const externalMountPoints = [
                '/Volumes',
                path.join((0, platform_1.getHomeDirectory)(), 'Desktop'),
                path.join((0, platform_1.getHomeDirectory)(), 'Documents'),
            ];
            for (const mountPoint of externalMountPoints) {
                try {
                    if (yield fs.pathExists(mountPoint)) {
                        drivePaths.push(mountPoint);
                    }
                }
                catch (err) {
                    (0, log_1.log)('debug', 'Failed to check mount point', { mountPoint, error: err.message });
                }
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'Failed to get all Windows drive paths', { error: err.message });
        }
        // Remove duplicates and return
        return [...new Set(drivePaths)];
    });
}
exports.getAllWindowsDrivePaths = getAllWindowsDrivePaths;
