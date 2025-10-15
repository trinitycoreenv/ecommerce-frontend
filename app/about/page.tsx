import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Globe, Zap, Users, Award, Calendar, Target, Shield, TrendingUp, MessageCircle } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function AboutPage() {
  const values = [
    { icon: <Heart className="h-8 w-8" />, title: "Trust & Transparency", description: "We believe in building honest relationships with our customers and vendors" },
    { icon: <Zap className="h-8 w-8" />, title: "Innovation & Growth", description: "Continuously improving our platform to help businesses scale" },
    { icon: <Users className="h-8 w-8" />, title: "Community & Support", description: "Fostering a supportive ecosystem for all our users" },
    { icon: <Shield className="h-8 w-8" />, title: "Security & Reliability", description: "Enterprise-grade security and 99.9% uptime guarantee" },
  ]

  const milestones = [
    { year: "2020", title: "Company Founded", description: "Started with a vision to revolutionize e-commerce" },
    { year: "2021", title: "First 1000 Vendors", description: "Reached our first major milestone" },
    { year: "2022", title: "Global Expansion", description: "Expanded to serve customers worldwide" },
    { year: "2023", title: "1M+ Transactions", description: "Processed over 1 million successful transactions" },
    { year: "2024", title: "Platform 2.0", description: "Launched our next-generation platform" },
  ]

  const team = [
    { name: "John Doe", role: "CEO & Founder", image: "/api/placeholder/150/150" },
    { name: "Jane Smith", role: "CTO", image: "/api/placeholder/150/150" },
    { name: "Mike Johnson", role: "Head of Product", image: "/api/placeholder/150/150" },
    { name: "Sarah Wilson", role: "Head of Operations", image: "/api/placeholder/150/150" },
  ]

  const stats = [
    { number: "10,000+", label: "Active Vendors" },
    { number: "1M+", label: "Happy Customers" },
    { number: "5M+", label: "Products Listed" },
    { number: "50+", label: "Countries Served" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-hero text-4xl md:text-6xl tracking-tight">
              Our <span className="text-primary">Story</span>
            </h1>
            <p className="text-subtitle text-xl text-muted-foreground max-w-2xl mx-auto">
              Building the future of e-commerce, together. We're on a mission to connect customers with trusted vendors worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register/vendor">Join Our Platform</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To empower businesses of all sizes to succeed in the digital marketplace by providing 
                    a secure, scalable, and user-friendly e-commerce platform that connects customers with 
                    trusted vendors worldwide.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the world's leading e-commerce platform that democratizes online selling, 
                    making it accessible and profitable for businesses everywhere while delivering 
                    exceptional value to customers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Our Values</h2>
            <p className="text-subtitle text-lg text-muted-foreground">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {value.icon}
                  </div>
                  <h3 className="text-xl text-heading mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform Statistics */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Platform Statistics</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Numbers that tell our story</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-title text-3xl md:text-4xl text-primary mb-2">{stat.number}</div>
                  <div className="text-body text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Journey */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Our Journey</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Key milestones in our growth</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Badge variant="outline" className="text-primary border-primary">
                        {milestone.year}
                      </Badge>
                      <h3 className="text-xl text-heading">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Meet Our Team</h2>
            <p className="text-subtitle text-lg text-muted-foreground">The people behind our success</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-muted-foreground">Photo</div>
                  </div>
                  <h3 className="text-lg text-heading mb-1">{member.name}</h3>
                  <p className="text-body text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology & Security */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Technology & Security</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Built with the latest technology and security standards</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Enterprise Security</h3>
                <p className="text-muted-foreground">Bank-level encryption and security protocols to protect your data</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Scalable Infrastructure</h3>
                <p className="text-muted-foreground">Cloud-based architecture that grows with your business</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Industry Compliance</h3>
                <p className="text-muted-foreground">Meeting all industry standards and regulatory requirements</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Awards & Recognition */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Awards & Recognition</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Recognized by industry leaders</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg text-heading mb-2">Best E-commerce Platform 2024</h3>
                <p className="text-body text-sm text-muted-foreground">TechCrunch Awards</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg text-heading mb-2">Innovation in Technology</h3>
                <p className="text-body text-sm text-muted-foreground">Forbes Innovation Awards</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg text-heading mb-2">Customer Satisfaction Excellence</h3>
                <p className="text-body text-sm text-muted-foreground">Customer Choice Awards</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg text-heading mb-2">Security Excellence</h3>
                <p className="text-body text-sm text-muted-foreground">Cybersecurity Awards</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative text-center space-y-6 py-16">
              <CardTitle className="text-title text-3xl md:text-4xl">
                Ready to Be Part of Our Story?
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Join thousands of businesses that trust our platform to grow their e-commerce operations. 
                Whether you're a customer or vendor, we're here to help you succeed.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg h-12 px-8">
                  <Link href="/register/vendor">Start Selling</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
