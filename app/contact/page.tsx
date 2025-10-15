import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, MessageCircle, Clock, HelpCircle, FileText, Users, Globe } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function ContactPage() {
  const contactMethods = [
    { icon: <Mail className="h-6 w-6" />, title: "Email Support", description: "support@ecommerceplatform.com", action: "Send Email" },
    { icon: <Phone className="h-6 w-6" />, title: "Phone Support", description: "+1 (555) 123-4567", action: "Call Now" },
    { icon: <MessageCircle className="h-6 w-6" />, title: "Live Chat", description: "Available 24/7", action: "Start Chat" },
    { icon: <HelpCircle className="h-6 w-6" />, title: "Help Center", description: "Self-service resources", action: "Browse Help" },
  ]

  const faqs = [
    { question: "How do I start selling on your platform?", answer: "Simply register as a vendor, choose your subscription plan, complete business verification, and start listing your products. The entire process takes just a few minutes." },
    { question: "What are your commission rates?", answer: "Our commission rates vary by subscription plan: Starter (15%), Basic (12%), Pro (8%), and Enterprise (5%). All plans include different features and benefits." },
    { question: "How do I track my orders?", answer: "You can track your orders through your customer dashboard. We provide real-time updates on order status, shipping information, and delivery confirmations." },
    { question: "What payment methods do you accept?", answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our encrypted payment system." },
    { question: "How long does shipping take?", answer: "Shipping times vary by vendor and location. Most orders are processed within 1-2 business days and delivered within 3-7 business days for domestic orders." },
    { question: "Can I return or exchange products?", answer: "Yes, our vendors offer return and exchange policies. You can initiate returns through your order history, and most vendors offer 30-day return windows." },
  ]

  const supportResources = [
    { icon: <FileText className="h-6 w-6" />, title: "Help Articles", description: "Step-by-step guides and tutorials", link: "Browse Articles" },
    { icon: <Users className="h-6 w-6" />, title: "Community Forum", description: "Connect with other users and get help", link: "Join Forum" },
    { icon: <MessageCircle className="h-6 w-6" />, title: "Video Tutorials", description: "Watch how-to videos and demos", link: "Watch Videos" },
    { icon: <HelpCircle className="h-6 w-6" />, title: "Status Page", description: "Check system uptime and issues", link: "View Status" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-hero text-4xl md:text-6xl tracking-tight">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-subtitle text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to help you every step of the way. Reach out to us with any questions or concerns.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Contact Us</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Choose the best way to reach us</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {method.icon}
                  </div>
                  <h3 className="text-xl text-heading mb-2">{method.title}</h3>
                  <p className="text-muted-foreground mb-4">{method.description}</p>
                  <Button variant="outline" className="w-full">
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-title text-3xl md:text-4xl mb-4">Send us a Message</h2>
              <p className="text-subtitle text-lg text-muted-foreground">We'll get back to you within 24 hours</p>
            </div>
            
            <Card className="border-2">
              <CardContent className="p-6">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-caption text-sm text-caption mb-2">Name *</label>
                      <Input id="name" placeholder="Your full name" required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-caption text-sm text-caption mb-2">Email *</label>
                      <Input id="email" type="email" placeholder="your@email.com" required />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-caption text-sm text-caption mb-2">Subject *</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="sales">Sales Inquiry</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-caption text-sm text-caption mb-2">Message *</label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us how we can help you..." 
                      className="min-h-[120px]"
                      required 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Office Information */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Office Information</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Visit us or reach out to our team</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Headquarters</h3>
                <p className="text-muted-foreground">
                  123 Business District<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Business Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                  Saturday: 10:00 AM - 4:00 PM PST<br />
                  Sunday: Closed
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl text-heading mb-2">Global Support</h3>
                <p className="text-muted-foreground">
                  We provide support in multiple time zones<br />
                  and languages to serve our global<br />
                  community of users.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Frequently Asked Questions</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Find answers to common questions</p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Support Resources */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Support Resources</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Additional help and resources</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportResources.map((resource, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {resource.icon}
                  </div>
                  <h3 className="text-xl text-heading mb-2">{resource.title}</h3>
                  <p className="text-muted-foreground mb-4">{resource.description}</p>
                  <Button variant="outline" className="w-full">
                    {resource.link}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative text-center space-y-6 py-16">
              <CardTitle className="text-title text-3xl md:text-4xl">
                Still Have Questions?
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Our support team is here to help you succeed. Don't hesitate to reach out 
                if you need assistance with anything.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg h-12 px-8">
                  <Link href="#contact-form">Send Message</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8">
                  <Link href="/help">Browse Help Center</Link>
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
