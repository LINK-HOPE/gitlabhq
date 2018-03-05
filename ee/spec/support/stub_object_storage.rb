module StubConfiguration
  def stub_object_storage_uploader(
    config:, uploader:, remote_directory:, enabled: true, licensed: true, 
    background_upload: false, direct_upload: false
  )
    Fog.mock!

    allow(config).to receive(:enabled) { enabled }
    allow(config).to receive(:background_upload) { background_upload }
    allow(config).to receive(:direct_upload) { direct_upload }

    stub_licensed_features(object_storage: licensed) unless licensed == :skip

    return unless enabled

    ::Fog::Storage.new(uploader.object_store_credentials).tap do |connection|
      begin
        connection.directories.create(key: remote_directory)
      rescue Excon::Error::Conflict
      end
    end
  end

  def stub_artifacts_object_storage(**params)
    stub_object_storage_uploader(config: Gitlab.config.artifacts.object_store,
                                 uploader: JobArtifactUploader,
                                 remote_directory: 'artifacts',
                                 **params)
  end

  def stub_lfs_object_storage(**params)
    stub_object_storage_uploader(config: Gitlab.config.lfs.object_store,
                                 uploader: LfsObjectUploader,
                                 remote_directory: 'lfs-objects',
                                 **params)
  end

  def stub_uploads_object_storage(uploader = described_class, **params)
    stub_object_storage_uploader(config: Gitlab.config.uploads.object_store,
                                 uploader: uploader,
                                 remote_directory: 'uploads',
                                 **params)
  end
end
