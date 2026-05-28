import { Card } from "@/components/ui/card";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { YouTubeSearchPanel } from "@/components/admin/YouTubeSearchPanel";

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export default function AdminMediaPage() {
  const cldOn = cloudinaryConfigured();
  const ytOn = Boolean(process.env.YOUTUBE_API_KEY);

  return (
    <div className="space-y-6">
      <Card>
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-base font-semibold">Cloudinary upload</h2>
          <p className="text-xs text-text-secondary">
            Upload ảnh / video trực tiếp lên Cloudinary qua signed URL.
            File không đi qua server của mình.
          </p>
        </div>
        <div className="p-5">
          {!cldOn ? (
            <div className="rounded-md border border-state-warning/40 bg-state-warning/5 p-4 text-sm text-text-secondary space-y-2">
              <p className="font-medium text-text-primary">
                Cloudinary chưa được cấu hình.
              </p>
              <p>
                Tạo tài khoản miễn phí tại{" "}
                <a
                  className="text-brand underline"
                  href="https://cloudinary.com/users/register/free"
                  target="_blank"
                  rel="noreferrer"
                >
                  cloudinary.com
                </a>{" "}
                rồi điền vào <code>.env.local</code>:
              </p>
              <pre className="rounded-md bg-surface-muted/60 p-3 text-xs">
{`CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...`}
              </pre>
            </div>
          ) : (
            <MediaUploader disabled={false} />
          )}
        </div>
      </Card>

      <Card>
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-base font-semibold">YouTube search</h2>
          <p className="text-xs text-text-secondary">
            Tìm video minh hoạ trên YouTube để lấy <code>videoId</code> gắn
            vào bài tập (trường <code>youtubeVideoId</code>).
          </p>
        </div>
        <div className="p-5">
          <YouTubeSearchPanel enabled={ytOn} />
        </div>
      </Card>
    </div>
  );
}
