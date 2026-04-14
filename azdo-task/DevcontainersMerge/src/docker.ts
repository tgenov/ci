import * as task from 'azure-pipelines-task-lib/task';
import * as docker from '../../../common/src/docker';
import {exec} from './exec';

export async function isDockerBuildXInstalled(): Promise<boolean> {
	return await docker.isDockerBuildXInstalled(exec);
}

export async function createMultiPlatformImage(
	imageName: string,
	tag: string,
	platformSuffixes: string[],
): Promise<boolean> {
	try {
		await docker.createMultiPlatformImage(exec, imageName, tag, platformSuffixes);
		return true;
	} catch (error) {
		task.setResult(task.TaskResult.Failed, `${error}`);
		return false;
	}
}
