/**
 * Build full image name strings, optionally suffixed with a platform tag.
 *
 * Example:
 *   buildImageNames('ghcr.io/org/img', ['v1', 'latest'], 'linux-amd64')
 *   => ['ghcr.io/org/img:v1-linux-amd64', 'ghcr.io/org/img:latest-linux-amd64']
 */
export function buildImageNames(
	imageName: string,
	imageTags: string[],
	platformTag?: string,
): string[] {
	return imageTags.map(tag =>
		platformTag
			? `${imageName}:${tag}-${platformTag}`
			: `${imageName}:${tag}`,
	);
}

/**
 * Create multi-arch manifests for each image tag by merging per-platform images.
 *
 * Returns true if all manifests were created successfully, false otherwise.
 */
export async function mergeMultiPlatformImages(
	imageName: string,
	imageTags: string[],
	mergeTag: string,
	createFn: (
		imageName: string,
		tag: string,
		platformTags: string[],
	) => Promise<boolean>,
	log: (message: string) => void,
): Promise<boolean> {
	const platformTags = mergeTag.split(/\s*,\s*/);
	for (const tag of imageTags) {
		log(`Creating multi-arch manifest for '${imageName}:${tag}'...`);
		const success = await createFn(imageName, tag, platformTags);
		if (!success) {
			return false;
		}
	}
	return true;
}
