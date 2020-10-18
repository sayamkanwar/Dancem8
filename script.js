import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";
import dat from "dat.gui";
import { get } from "https";

let image = null;
let predictedPoses = null;
let partObjects = [];
let comparisonResult = [];
const delta = 2; // threshold

function disposePoses() {
	if (predictedPoses) {
		predictedPoses = null;
	}
}

async function testImageAndEstimatePoses(net) {
	disposePoses();
	image = document.getElementById("test_img");
	const input = tf.browser.fromPixels(image);
	const poses = await net.estimatePoses(input, {
		flipHorizontal: false,
		decodingMethod: "single-person",
		maxDetections: guiState.multiPoseDetection.maxDetections,
		scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
		nmsRadius: guiState.multiPoseDetection.nmsRadius
	});
	predictedPoses = poses;
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
	requiredPartLabels.forEach(function(partLabel) {
		partObjects.push(getCoordinates(partLabel, keypoints_array));
	});
}

function getCoordinates(partLabel, keypoints_array) {
	let result = {};
	keypoints_array.forEach(function(obj) {
		if (obj.part === partLabel) {
			result = {
				part: partLabel,
				x: obj.position.x,
				y: obj.position.y
			};
		}
	});
	return result;
}

async function comparePose(partObjects) {
	for (let i = 1; i < partObjects.length; i++) {
		let comparedObj = await compareDistance(
			localStorage.getItem("step_no"),
			partObjects[i]
		);
		comparisonResult.push(comparedObj);
	}
	console.log("Comparison Result: ");
	console.log(comparisonResult);
}

async function compareDistance(step_no, partObj) {
	let trainer_data = null;
	let realistic_distance = 0;
	await fetch(
		"https://sayamkanwar.com/dancem8/" +
			localStorage.getItem("dance_move") +
			".json"
	)
		.then(response => response.json())
		.then(data => {
			trainer_data = data[step_no];
			let userPartDistance = calculateDistance(partObjects[0], partObj); // partObjects[0] = user nose obj
			let trainerPartDistance = calculateDistance(
				trainer_data[0],
				trainer_data.find(x => x.part === partObj.part)
			); // trainer_data[0] = trainer nose obj
			console.log("User: " + userPartDistance);
			console.log("Trainer: " + trainerPartDistance);
			console.log(userPartDistance - trainerPartDistance);
			let distance_difference = userPartDistance - trainerPartDistance;
			realistic_distance = calculateDistancePostThreshold(distance_difference);
		});

	return {
		part: partObj.part,
		difference: realistic_distance
	};
}

function calculateDistancePostThreshold(distance_difference) {
	let realistic_distance = 0;
	if (distance_difference < 0) {
		realistic_distance = distance_difference + delta;
	} else if (distance_difference > 0) {
		realistic_distance = distance_difference - delta;
	}

	return realistic_distance;
}

function calculateDistance(part1, part2) {
	let x1 = part1.x;
	let y1 = part1.y;
	let x2 = part2.x;
	let y2 = part2.y;
	let x_difference = x2 - x1;
	let y_difference = y2 - y1;

	return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
}

function generateQualitativeFeedback() {
	comparisonResult.forEach(function(comparedObj) {
		let part_difference = comparedObj.difference;
		let feedback = "";
		if (part_difference <= 10 && part_difference > 2) {
			feedback = "Bend it slightly";
		} else if (part_difference > 10) {
			feedback = "Bend it significantly";
		} else if (part_difference >= -10 && part_difference < -2) {
			feedback = "Straighten it slightly";
		} else if (part_difference < -10) {
			feedback = "Straighten it significantly";
		} else if (part_difference <= 2 && part_difference >= -2) {
			feedback = "No change needed";
		}

		document.getElementById(
			comparedObj.part + "_feedback"
		).innerHTML = feedback;
	});
	document.getElementById("feedback_loading").style.display = "none";
	document.getElementById("feedback_table").style.display = "inline-block";
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
export async function bindPage() {
	const net = await posenet.load({
		architecture: guiState.model.architecture,
		outputStride: guiState.model.outputStride,
		inputResolution: guiState.model.inputResolution,
		multiplier: guiState.model.multiplier,
		quantBytes: guiState.model.quantBytes
	});
	await testImageAndEstimatePoses(net);
	await comparePose(partObjects);
	generateQualitativeFeedback();
}

bindPage();
