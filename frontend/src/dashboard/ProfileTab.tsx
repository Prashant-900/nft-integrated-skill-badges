import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { colors } from '../config/colors';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

interface CustomBadge {
  id: string;
  badge_name: string;
  svg_url: string;
  created_at: string;
  is_default?: boolean;
}

interface ProfileTabProps {
  userId: string;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userId }) => {
  const [badgeName, setBadgeName] = useState('');
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgPreview, setSvgPreview] = useState<string | null>(null);
  const [customBadges, setCustomBadges] = useState<CustomBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomBadges();
  }, [userId]);

  const fetchCustomBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching badges for user:', userId);
      
      const { data, error } = await supabase
        .from('custom_badges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched badges:', data);
      
      // Just show user's badges (including default ones created at signup)
      setCustomBadges(data || []);
    } catch (err: any) {
      console.error('Error fetching custom badges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('svg')) {
      setError('Please upload an SVG file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB');
      return;
    }

    setSvgFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSvgPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBadge = async () => {
    if (!badgeName.trim()) {
      setError('Please enter a badge name');
      return;
    }

    if (!svgFile) {
      setError('Please select an SVG file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      console.log('Uploading badge for user:', userId);

      // Upload SVG to Supabase Storage
      const fileExt = 'svg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `badges/${fileName}`;

      console.log('Uploading file to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('stellar')
        .upload(filePath, svgFile, {
          contentType: 'image/svg+xml',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stellar')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Save badge to database
      console.log('Saving to database:', { user_id: userId, badge_name: badgeName.trim(), svg_url: publicUrl });
      
      const { error: dbError } = await supabase
        .from('custom_badges')
        .insert({
          user_id: userId,
          badge_name: badgeName.trim(),
          svg_url: publicUrl
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      setSuccess('Badge created successfully! 🎉');
      setBadgeName('');
      setSvgFile(null);
      setSvgPreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('svg-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh badges list
      await fetchCustomBadges();
    } catch (err: any) {
      console.error('Error uploading badge:', err);
      setError(err.message || 'Failed to upload badge');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBadge = async (badgeId: string, svgUrl: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;

    try {
      setLoading(true);

      // Extract file path from URL
      const urlParts = svgUrl.split('/stellar/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('stellar')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('custom_badges')
        .delete()
        .eq('id', badgeId);

      if (error) throw error;

      setSuccess('Badge deleted successfully');
      await fetchCustomBadges();
    } catch (err: any) {
      console.error('Error deleting badge:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Create Badge Section */}
      <Card style={{ backgroundColor: colors.purpleLight }} className="border-2 shadow-[-4px_-4px_0px_0px_rgba(0,0,0,1)] border-black">
        <CardHeader>
          <CardTitle>Create Custom Badge</CardTitle>
          <CardDescription>Design your own SVG badge to mint as NFT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div
              className="p-3 rounded-base border-2 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{
                backgroundColor: colors.redLight,
                borderColor: colors.red,
                color: colors.red,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="p-3 rounded-base border-2 font-medium shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{
                backgroundColor: colors.greenLight,
                borderColor: colors.green,
                color: colors.green,
              }}
            >
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badge Name Input */}
            <div className="space-y-2">
              <Label>
                Badge Name <span style={{ color: colors.red }}>*</span>
              </Label>
              <Input
                type="text"
                value={badgeName}
                onChange={(e) => setBadgeName(e.target.value)}
                placeholder="e.g., Python Expert Badge"
                maxLength={100}
              />
            </div>

            {/* SVG File Upload */}
            <div className="space-y-2">
              <Label>
                Upload SVG File <span style={{ color: colors.red }}>*</span>
              </Label>
              <Input
                id="svg-upload"
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500">Max size: 1MB</p>
            </div>
          </div>

          {/* SVG Preview */}
          {svgPreview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="p-4 rounded-base border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
                style={{ backgroundColor: colors.white, minHeight: '180px' }}
              >
                <img
                  src={svgPreview}
                  alt="SVG Preview"
                  className="max-w-full max-h-56"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUploadBadge}
            disabled={uploading || !badgeName.trim() || !svgFile}
            className="w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[-4px_-4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[8px] active:translate-y-[8px] transition-all duration-150"
            variant="default"
          >
            {uploading ? 'Uploading...' : 'Create Badge'}
          </Button>
        </CardContent>
      </Card>

      {/* My Badges List */}
      <Card style={{ backgroundColor: colors.yellowLight }} className="border-2 shadow-[-4px_-4px_0px_0px_rgba(0,0,0,1)] border-black">
        <CardHeader>
          <CardTitle>My Custom Badges ({customBadges.length})</CardTitle>
          <CardDescription>Your personalized NFT badge collection</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && customBadges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading badges...
            </div>
          ) : customBadges.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <h4 className="text-lg font-bold">No custom badges yet</h4>
              <p className="text-gray-600 text-sm">Create your first badge above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {customBadges.map((badge, index) => {
                const badgeColors = [
                  colors.blueLight,
                  colors.greenLight,
                  colors.orangeLight,
                  colors.pinkLight,
                  colors.cyanLight,
                  colors.limeLight
                ];
                const bgColor = badgeColors[index % badgeColors.length];
                
                return (
                  <Card
                    key={badge.id}
                    className="overflow-hidden hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* Badge Image */}
                    <div
                      className="h-32 flex items-center justify-center p-3 border-b-2 border-black"
                      style={{ backgroundColor: colors.white }}
                    >
                      <img
                        src={badge.svg_url}
                        alt={badge.badge_name}
                        className="max-w-full max-h-full"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>

                    {/* Badge Info */}
                    <CardContent className="space-y-1.5 p-2.5">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-sm leading-tight">
                          {badge.badge_name}
                        </h4>
                        {badge.is_default && (
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-base border-2 border-black"
                            style={{
                              backgroundColor: colors.greenLight,
                              color: colors.green,
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        Created: {new Date(badge.created_at).toLocaleDateString()}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <Button
                          onClick={() => window.open(badge.svg_url, '_blank')}
                          className="flex-1 text-xs py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
                          variant="default"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => handleDeleteBadge(badge.id, badge.svg_url)}
                          disabled={loading}
                          className="flex-1 text-xs py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150"
                          style={{
                            backgroundColor: colors.red,
                            borderColor: colors.red,
                            color: colors.white,
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
