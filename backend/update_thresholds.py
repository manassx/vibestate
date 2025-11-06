import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_gallery_thresholds():
    """Update all galleries with threshold 100 to 80"""
    try:
        # Get all galleries
        result = supabase.table('galleries').select('id, config').execute()
        
        galleries = result.data
        updated_count = 0
        
        for gallery in galleries:
            config = gallery.get('config', {})
            
            # Check if threshold is 100
            if config.get('threshold') == 100:
                # Update to 80
                config['threshold'] = 80
                
                # Update in database
                supabase.table('galleries').update({
                    'config': config
                }).eq('id', gallery['id']).execute()
                
                updated_count += 1
                print(f"Updated gallery {gallery['id']}: threshold 100 → 80")
        
        print(f"\n✅ Updated {updated_count} galleries!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🔧 Updating gallery thresholds from 100 to 80...\n")
    update_gallery_thresholds()
