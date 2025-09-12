/**
 * macOS virtualization detection utilities for Crossover, Parallels, VMware, and VirtualBox
 */
/**
 * Check if Crossover is installed and get its bottle paths
 */
export declare function getCrossoverPaths(): Promise<string[]>;
/**
 * Check if Parallels is installed and get its VM paths
 */
export declare function getParallelsPaths(): Promise<string[]>;
/**
 * Check if VMware Fusion is installed and get its VM paths
 */
export declare function getVMwarePaths(): Promise<string[]>;
/**
 * Check if VirtualBox is installed and get its VM paths
 */
export declare function getVirtualBoxPaths(): Promise<string[]>;
/**
 * Get Windows drive paths from Crossover bottles
 */
export declare function getCrossoverWindowsDrives(): Promise<string[]>;
/**
 * Get Windows drive paths from Parallels VMs
 * Note: This is a simplified approach as accessing Parallels VM filesystems
 * requires mounting or special tools
 */
export declare function getParallelsWindowsDrives(): Promise<string[]>;
/**
 * Get Windows drive paths from VMware VMs
 */
export declare function getVMwareWindowsDrives(): Promise<string[]>;
/**
 * Get Windows drive paths from VirtualBox VMs
 */
export declare function getVirtualBoxWindowsDrives(): Promise<string[]>;
/**
 * Get all Windows-compatible drive paths on macOS
 * This includes:
 * 1. Native macOS drives (for native Windows games through tools like Porting Kit)
 * 2. Crossover bottle drives
 * 3. Parallels VM shared folders
 * 4. VMware VM shared folders
 * 5. VirtualBox VM shared folders
 */
export declare function getAllWindowsDrivePaths(): Promise<string[]>;
