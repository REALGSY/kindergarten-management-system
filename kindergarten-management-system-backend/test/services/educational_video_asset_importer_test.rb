require "test_helper"
require "fileutils"
require "json"
require "tmpdir"

class EducationalVideoAssetImporterTest < ActiveSupport::TestCase
  test "parses categorized video filename" do
    parsed = EducationalVideoAssetImporter.parse_filename("认识数字_中班_初级_数学.mp4")

    assert_equal "认识数字_中班_初级_数学.mp4", parsed[:filename]
    assert_equal "认识数字", parsed[:title]
    assert_equal "中班", parsed[:stage]
    assert_equal "初级", parsed[:level]
    assert_equal "数学", parsed[:subject]
  end

  test "rejects video filename without all category parts" do
    error = assert_raises(ArgumentError) do
      EducationalVideoAssetImporter.parse_filename("认识数字.mp4")
    end

    assert_includes error.message, "标题_阶段_级别_学科"
  end

  test "imports five published categorized videos and remains idempotent" do
    assets = [
      ["数字 1 到 20_大班_初级_数学.mp4", "数字 1 到 20", "大班", "初级", "数学", 5, 6],
      ["认识七种颜色_小班_进阶_识字.mp4", "认识七种颜色", "小班", "进阶", "识字", 3, 3],
      ["自然拼读 A、M、N、Q、R_大班_初级_英语.mp4", "自然拼读 A、M、N、Q、R", "大班", "初级", "英语", 5, 6],
      ["认识长颈鹿_中班_进阶_自然认知.mp4", "认识长颈鹿", "中班", "进阶", "自然认知", 4, 4],
      ["声母歌_大班_初级_识字.mp4", "声母歌", "大班", "初级", "识字", 5, 6]
    ]

    Dir.mktmpdir("educational-video-import") do |directory|
      assets.each_with_index do |asset, index|
        filename = asset.first
        File.binwrite(File.join(directory, filename), "fake-video-#{index}")
      end
      File.write(
        File.join(directory, "source_manifest.json"),
        JSON.generate(
          assets.map do |filename, title, stage, level, subject, _min_age, _max_age|
            {
              "文件名" => filename,
              "标题" => title,
              "阶段" => stage,
              "级别" => level,
              "学科" => subject,
              "来源" => "用户提供",
              "许可" => "用户已确认可公开发布"
            }
          end
        )
      )

      first_result = EducationalVideoAssetImporter.new(root: directory, admin: nil).import!
      assert_equal 5, first_result.created
      assert_equal 0, first_result.updated
      assert_equal 0, first_result.skipped

      assets.each do |filename, title, stage, level, subject, min_age, max_age|
        video = EducationalVideo.find_by!(title: title, stage: stage, level: level, subject: subject)
        assert_equal EducationalVideo::PUBLISHED, video.status
        assert_equal [min_age, max_age], [video.min_age, video.max_age]
        assert_equal filename, video.video_file.filename.to_s
        assert_includes video.description, "用户已确认可公开发布"
      end

      second_result = EducationalVideoAssetImporter.new(root: directory, admin: nil).import!
      assert_equal 0, second_result.created
      assert_equal 0, second_result.updated
      assert_equal 5, second_result.skipped

      replacement_path = File.join(directory, assets.first.first)
      File.binwrite(replacement_path, "replacement-video-payload")
      third_result = EducationalVideoAssetImporter.new(root: directory, admin: nil).import!
      assert_equal 0, third_result.created
      assert_equal 1, third_result.updated
      assert_equal 4, third_result.skipped
      assert_equal File.size(replacement_path), EducationalVideo.find_by!(title: "数字 1 到 20").video_file.byte_size
    end
  end
end
