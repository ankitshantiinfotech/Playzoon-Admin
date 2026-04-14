export const CROP_PRESETS = {
  profilePhoto: { aspect: 1, outputWidth: 400, outputHeight: 400, circularMask: true, title: 'Crop Profile Photo' },
  sportIcon: { aspect: 1, outputWidth: 512, outputHeight: 512, circularMask: false, title: 'Crop Sport Icon' },
  coachProfile: { aspect: 1, outputWidth: 400, outputHeight: 400, circularMask: true, title: 'Crop Coach Photo' },
  facilityImage: { aspect: 4 / 3, outputWidth: 1200, outputHeight: 900, circularMask: false, title: 'Crop Facility Image' },
  trainingImage: { aspect: 16 / 9, outputWidth: 1200, outputHeight: 675, circularMask: false, title: 'Crop Training Image' },
  banner: { aspect: 3, outputWidth: 1200, outputHeight: 400, circularMask: false, title: 'Crop Banner Image' },
  tournamentImage: { aspect: 16 / 9, outputWidth: 1200, outputHeight: 675, circularMask: false, title: 'Crop Tournament Image' },
} as const;

export type CropPresetKey = keyof typeof CROP_PRESETS;
