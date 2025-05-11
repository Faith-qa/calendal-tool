const user = req.user as User;

@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  const user = req.user as User;
  return { user };
} 