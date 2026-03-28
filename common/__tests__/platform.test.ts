import {buildImageNames, mergeMultiPlatformImages} from '../src/platform';

describe('buildImageNames', () => {
	test('single tag without platformTag', () => {
		expect(buildImageNames('img', ['v1'])).toEqual(['img:v1']);
	});

	test('single tag with platformTag', () => {
		expect(buildImageNames('img', ['v1'], 'linux-amd64')).toEqual(['img:v1-linux-amd64']);
	});

	test('multiple tags without platformTag', () => {
		expect(buildImageNames('img', ['v1', 'latest'])).toEqual(['img:v1', 'img:latest']);
	});

	test('multiple tags with platformTag', () => {
		expect(buildImageNames('img', ['v1', 'latest'], 'linux-amd64')).toEqual([
			'img:v1-linux-amd64',
			'img:latest-linux-amd64',
		]);
	});

	test('empty tags array', () => {
		expect(buildImageNames('img', [])).toEqual([]);
	});

	test('undefined platformTag explicitly passed', () => {
		expect(buildImageNames('img', ['v1'], undefined)).toEqual(['img:v1']);
	});
});

describe('mergeMultiPlatformImages', () => {
	test('calls createFn for each tag with correct platform tags split from mergeTag', async () => {
		const createFn = jest.fn<Promise<boolean>, [string, string, string[]]>()
			.mockResolvedValue(true);
		const log = jest.fn();

		await mergeMultiPlatformImages('img', ['v1', 'latest'], 'linux-amd64,linux-arm64', createFn, log);

		expect(createFn).toHaveBeenCalledTimes(2);
		expect(createFn).toHaveBeenNthCalledWith(1, 'img', 'v1', ['linux-amd64', 'linux-arm64']);
		expect(createFn).toHaveBeenNthCalledWith(2, 'img', 'latest', ['linux-amd64', 'linux-arm64']);
	});

	test('returns true when all createFn calls succeed', async () => {
		const createFn = jest.fn<Promise<boolean>, [string, string, string[]]>()
			.mockResolvedValue(true);
		const log = jest.fn();

		const result = await mergeMultiPlatformImages('img', ['v1', 'latest'], 'linux-amd64,linux-arm64', createFn, log);

		expect(result).toBe(true);
	});

	test('returns false and stops on first createFn failure', async () => {
		const createFn = jest.fn<Promise<boolean>, [string, string, string[]]>()
			.mockResolvedValueOnce(false);
		const log = jest.fn();

		const result = await mergeMultiPlatformImages('img', ['v1', 'latest'], 'linux-amd64,linux-arm64', createFn, log);

		expect(result).toBe(false);
		expect(createFn).toHaveBeenCalledTimes(1);
	});

	test('logs a message for each tag', async () => {
		const createFn = jest.fn<Promise<boolean>, [string, string, string[]]>()
			.mockResolvedValue(true);
		const log = jest.fn();

		await mergeMultiPlatformImages('img', ['v1', 'latest'], 'linux-amd64,linux-arm64', createFn, log);

		expect(log).toHaveBeenCalledTimes(2);
		expect(log).toHaveBeenNthCalledWith(1, "Creating multi-arch manifest for 'img:v1'...");
		expect(log).toHaveBeenNthCalledWith(2, "Creating multi-arch manifest for 'img:latest'...");
	});

	test('handles comma-separated mergeTag with whitespace', async () => {
		const createFn = jest.fn<Promise<boolean>, [string, string, string[]]>()
			.mockResolvedValue(true);
		const log = jest.fn();

		await mergeMultiPlatformImages('img', ['v1'], 'linux-amd64 , linux-arm64', createFn, log);

		expect(createFn).toHaveBeenCalledWith('img', 'v1', ['linux-amd64', 'linux-arm64']);
	});
});
