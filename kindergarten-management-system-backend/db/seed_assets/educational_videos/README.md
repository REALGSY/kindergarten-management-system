# Child educational videos

Videos in this directory are imported into `EducationalVideo` with:

```bash
bundle exec rails educational_videos:import_child_assets
```

The importer expects video filenames to use this format:

```text
标题_阶段_级别_学科.mp4
```

The task is idempotent. It creates or updates published video records and only re-attaches a file when the filename or byte size changes.
