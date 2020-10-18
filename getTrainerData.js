/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";
import dat from "dat.gui";

import { get } from "https";

let image = null;
let predictedPoses = null;

/**
 * Purges variables and frees up GPU memory using dispose() method
 */
function disposePoses() {
	if (predictedPoses) {
		predictedPoses = null;
	}
}
/**
 * Loads an image, feeds it into posenet the posenet model, and
 * calculates poses based on the model outputs
 */
async function testImageAndEstimatePoses(net) {
	// Purge prevoius variables and free up GPU memory
	disposePoses();

	image = document.getElementById("test_img");

	// Creates a tensor from an image
	const input = tf.browser.fromPixels(image);

	// Estimates poses
	const poses = await net.estimatePoses(input, {
		flipHorizontal: false,
		decodingMethod: "multi-person",
		maxDetections: guiState.multiPoseDetection.maxDetections,
		scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
		nmsRadius: guiState.multiPoseDetection.nmsRadius
	});
	predictedPoses = poses;
	console.log(predictedPoses[0].keypoints);
	createBodyPartsArray(predictedPoses[0].keypoints);

	input.dispose();
}

function createBodyPartsArray(keypoints_array) {
	let requiredPartLabels = [
		"nose",
		"leftShoulder",
		"rightShoulder",
		"leftElbow",
		"rightElbow",
		"leftWrist",
		"rightWrist",
		"leftHip",
		"rightHip",
		"leftKnee",
		"rightKnee",
		"leftAnkle",
		"rightAnkle"
	];
	let partObjects = [];
	requiredPartLabels.forEach(function(partLabel) {
		partObjects.push(getCoordinates(partLabel, keypoints_array));
	});
	console.log(JSON.stringify(partObjects));
}

function getCoordinates(partLabel, keypoints_array) {
	let result = {};
	keypoints_array.forEach(function(obj) {
		if (obj.part === partLabel) {
			result = { part: partLabel, x: obj.position.x, y: obj.position.y };
		}
	});
	return result;
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 513;

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 32;
const defaultResNetInputResolution = 257;

let guiState = {
	net: null,
	model: {
		architecture: "MobileNetV1",
		outputStride: defaultMobileNetStride,
		inputResolution: defaultMobileNetInputResolution,
		multiplier: defaultMobileNetMultiplier,
		quantBytes: defaultQuantBytes
	},
	multiPoseDetection: {
		minPartConfidence: 0.1,
		minPoseConfidence: 0.2,
		nmsRadius: 20.0,
		maxDetections: 15
	}
};

/**
 * Kicks off the demo by loading the posenet model and estimating
 * poses on a default image
 */
export async function bindPage() {
	const net = await posenet.load({
		architecture: guiState.model.architecture,
		outputStride: guiState.model.outputStride,
		inputResolution: guiState.model.inputResolution,
		multiplier: guiState.model.multiplier,
		quantBytes: guiState.model.quantBytes
	});
	await testImageAndEstimatePoses(net);
}

bindPage();
