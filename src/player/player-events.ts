/** Player events for use with `player.on()` / `player.off()`. Access via `mpegts.Events`. */
enum PlayerEvents {
	/** An error occurred during playback. */
	ERROR = "error",
	/** The input MediaDataSource has been completely buffered to end. */
	LOADING_COMPLETE = "loading_complete",
	/** An unexpected network EOF occurred during buffering but was automatically recovered. */
	RECOVERED_EARLY_EOF = "recovered_early_eof",
	/** Provides technical information of the media (video/audio codec, bitrate, etc.). */
	MEDIA_INFO = "media_info",
	/** Provides Timed ID3 Metadata packets (stream_type=0x15). */
	TIMED_ID3_METADATA_ARRIVED = "timed_id3_metadata_arrived",
	/** Provides PGS Subtitle data (stream_type=0x90). */
	PGS_SUBTITLE_ARRIVED = "pgs_subtitle_arrived",
	/** Provides Synchronous KLV Metadata packets (stream_type=0x15). */
	SYNCHRONOUS_KLV_METADATA_ARRIVED = "synchronous_klv_metadata_arrived",
	/** Provides Asynchronous KLV Metadata packets (stream_type=0x06). */
	ASYNCHRONOUS_KLV_METADATA_ARRIVED = "asynchronous_klv_metadata_arrived",
	/** Provides SMPTE2038 Metadata packets. */
	SMPTE2038_METADATA_ARRIVED = "smpte2038_metadata_arrived",
	/** Provides SCTE35 Metadata section packets (stream_type=0x86). */
	SCTE35_METADATA_ARRIVED = "scte35_metadata_arrived",
	/** Provides ISO/IEC 13818-1 PES private data descriptor. */
	PES_PRIVATE_DATA_DESCRIPTOR = "pes_private_data_descriptor",
	/** Provides ISO/IEC 13818-1 PES packets containing private data (stream_type=0x06). */
	PES_PRIVATE_DATA_ARRIVED = "pes_private_data_arrived",
	/** Provides playback statistics (dropped frames, current speed, etc.). */
	STATISTICS_INFO = "statistics_info",
	/** Fired when the player begins teardown. */
	DESTROYING = "destroying",
}

export default PlayerEvents;
