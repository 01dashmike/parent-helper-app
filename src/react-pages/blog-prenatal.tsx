import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, Heart } from 'lucide-react';
import { Link } from 'wouter';
import type { BlogPost } from '@shared/schema';

// This file is not used as a route by Astro. See blog-prenatal.astro for the actual page.

export default function BlogPrenatal() {
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
  });

  const filteredPosts = posts.filter(post => 
    post.category?.includes('prenatal') && post.isPublished
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral/10 via-white to-lavender/10">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 via-white to-lavender/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="mb-4 text-coral hover:text-coral/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral/20 to-coral/40 flex items-center justify-center">
                <Heart className="w-8 h-8 text-coral" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-poppins text-teal-dark mb-4">
              Pre-natal Guide
            </h1>
            <p className="text-lg text-sage max-w-2xl mx-auto">
              Pregnancy tips, preparation for baby, and getting ready for parenthood.
            </p>
            <Badge variant="secondary" className="mt-4 bg-coral/10 text-coral">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
            </Badge>
          </div>
        </div>

        {/* Articles */}
        <div className="grid gap-8 md:gap-12">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-coral/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-sage mb-2">Coming Soon</h3>
              <p className="text-sage/60">We're preparing valuable pregnancy and pre-natal content for you.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="md:flex">
                  {post.imageUrl && (
                    <div className="md:w-1/3">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className={`p-8 ${post.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
                    <div className="flex items-center gap-4 text-sm text-sage mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Recently'}
                      </div>
                      {post.readTimeMinutes && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTimeMinutes} min read
                        </div>
                      )}
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold font-poppins text-teal-dark mb-4 hover:text-coral transition-colors">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    
                    <p className="text-sage leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                    
                    <Link href={`/blog/${post.slug}`}>
                      <Button className="bg-coral hover:bg-coral/90 text-white">
                        Read Full Article
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}