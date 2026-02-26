import {parseMount, createManifest} from '../src/docker';
import {ExecFunction, ExecResult} from '../src/exec';

describe('parseMount', () => {
	test('handles type,src,dst', () => {
		const input = 'type=bind,src=/my/source,dst=/my/dest';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
	test('handles type,source,destination', () => {
		const input = 'type=bind,source=/my/source,destination=/my/dest';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
	test('handles type,source,target', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});

	test('throws on unexpected option', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest,made-up';
		const action = () => parseMount(input);
		expect(action).toThrow("Unhandled mount option 'made-up'");
	});

	test('ignores readonly', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest,readonly';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
	test('ignores ro', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest,ro';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
	test('ignores readonly with value', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest,readonly=false';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
	test('ignores ro with value', () => {
		const input = 'type=bind,source=/my/source,target=/my/dest,ro=0';
		const result = parseMount(input);
		expect(result.type).toBe('bind');
		expect(result.source).toBe('/my/source');
		expect(result.target).toBe('/my/dest');
	});
});

describe('createManifest', () => {
	test('should call docker buildx imagetools create with correct args for two platforms', async () => {
		const mockExec = jest.fn<Promise<ExecResult>, Parameters<ExecFunction>>()
			.mockResolvedValue({exitCode: 0, stdout: '', stderr: ''});

		await createManifest(mockExec, 'ghcr.io/my-org/my-image', 'v1.0.0', ['linux-amd64', 'linux-arm64']);

		expect(mockExec).toHaveBeenCalledTimes(1);
		expect(mockExec).toHaveBeenCalledWith(
			'docker',
			[
				'buildx', 'imagetools', 'create',
				'-t', 'ghcr.io/my-org/my-image:v1.0.0',
				'ghcr.io/my-org/my-image:v1.0.0-linux-amd64',
				'ghcr.io/my-org/my-image:v1.0.0-linux-arm64',
			],
			{},
		);
	});

	test('should throw when docker command returns non-zero exit code', async () => {
		const mockExec = jest.fn<Promise<ExecResult>, Parameters<ExecFunction>>()
			.mockResolvedValue({exitCode: 1, stdout: '', stderr: 'error'});

		await expect(
			createManifest(mockExec, 'ghcr.io/my-org/my-image', 'v1.0.0', ['linux-amd64', 'linux-arm64']),
		).rejects.toThrow('manifest creation failed with 1');
	});

	test('should handle a single platform tag', async () => {
		const mockExec = jest.fn<Promise<ExecResult>, Parameters<ExecFunction>>()
			.mockResolvedValue({exitCode: 0, stdout: '', stderr: ''});

		await createManifest(mockExec, 'ghcr.io/my-org/my-image', 'latest', ['linux-amd64']);

		expect(mockExec).toHaveBeenCalledTimes(1);
		expect(mockExec).toHaveBeenCalledWith(
			'docker',
			[
				'buildx', 'imagetools', 'create',
				'-t', 'ghcr.io/my-org/my-image:latest',
				'ghcr.io/my-org/my-image:latest-linux-amd64',
			],
			{},
		);
	});

	test('should handle multiple image tags', async () => {
		const mockExec = jest.fn<Promise<ExecResult>, Parameters<ExecFunction>>()
			.mockResolvedValue({exitCode: 0, stdout: '', stderr: ''});

		await createManifest(mockExec, 'ghcr.io/my-org/my-image', 'v1.0.0', ['linux-amd64']);
		await createManifest(mockExec, 'ghcr.io/my-org/my-image', 'latest', ['linux-amd64']);

		expect(mockExec).toHaveBeenCalledTimes(2);
		expect(mockExec).toHaveBeenNthCalledWith(
			1,
			'docker',
			[
				'buildx', 'imagetools', 'create',
				'-t', 'ghcr.io/my-org/my-image:v1.0.0',
				'ghcr.io/my-org/my-image:v1.0.0-linux-amd64',
			],
			{},
		);
		expect(mockExec).toHaveBeenNthCalledWith(
			2,
			'docker',
			[
				'buildx', 'imagetools', 'create',
				'-t', 'ghcr.io/my-org/my-image:latest',
				'ghcr.io/my-org/my-image:latest-linux-amd64',
			],
			{},
		);
	});
});
