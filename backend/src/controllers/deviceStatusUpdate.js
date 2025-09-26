/**
 * Update device status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDeviceStatus = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const { registrationMode, location, reason, status } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    // Check if the device exists
    const device = await ApiKey.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    // Update device metadata
    let metadata = device.metadata || {};

    // Update location if provided
    if (location) {
      metadata.location = location;
    }

    // Update status information if provided
    if (status) {
      metadata.status = {
        ...metadata.status,
        ...status,
        lastUpdated: new Date(),
      };
    }

    // Add reason to the status history
    if (!metadata.statusHistory) {
      metadata.statusHistory = [];
    }

    // Keep only the last 10 status updates
    metadata.statusHistory.unshift({
      timestamp: new Date(),
      reason,
      registrationMode,
    });

    if (metadata.statusHistory.length > 10) {
      metadata.statusHistory = metadata.statusHistory.slice(0, 10);
    }

    // Update the device metadata
    await device.update({
      metadata,
      lastUsed: new Date(),
    });

    // If registration mode is explicitly set to false and reason is registration_success
    // or registration_timeout, update the global registration mode state
    if (
      registrationMode === false &&
      (reason === "registration_success" || reason === "registration_timeout")
    ) {
      const currentMode = deviceRegistrationMode.get(deviceId);

      if (currentMode && currentMode.enabled) {
        deviceRegistrationMode.set(deviceId, {
          ...currentMode,
          enabled: false,
        });

        logger.info(
          `Device ${deviceId} registration mode disabled due to ${reason}`
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Device status updated",
      data: {
        deviceId,
        registrationMode:
          deviceRegistrationMode.get(deviceId)?.enabled || false,
      },
    });
  } catch (error) {
    logger.error(`Error updating device status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
