import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create a course payment intent for a student checkout flow' })
  createCheckout(
    @CurrentUser() user: { id: string },
    @Body() body: { courseId: string; amount?: number; currency?: string; provider?: string; method?: any; description?: string },
  ) {
    return this.paymentsService.createPaymentIntent({
      courseId: body.courseId,
      userId: user.id,
      amount: body.amount ?? 0,
      currency: body.currency,
      provider: body.provider,
      method: body.method,
      description: body.description,
    });
  }

  @Post(':paymentId/complete')
  @ApiOperation({ summary: 'Complete a payment and activate the student enrollment' })
  completePayment(
    @CurrentUser() user: { id: string },
    @Param('paymentId') paymentId: string,
    @Body() body: { providerPaymentId?: string; providerChargeId?: string; metadata?: Record<string, any> },
  ) {
    void user;
    return this.paymentsService.completePayment(paymentId, body);
  }
}
