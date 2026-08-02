import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentBookingService } from './services';
import { CreateBookingDto, CancelBookingDto, RescheduleBookingDto } from './dto/student.dto';

@ApiTags('Student Bookings')
@ApiBearerAuth()
@Controller('student/bookings')
export class StudentBookingsController {
  constructor(private readonly bookingService: StudentBookingService) {}

  @Get()
  @ApiOperation({ summary: 'Get my bookings' })
  getMyBookings(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.bookingService.getMyBookings(user, status);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get teacher availability slots' })
  getTeacherAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.bookingService.getTeacherAvailability(user, teacherId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get booking calendar' })
  getBookingCalendar(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.getBookingCalendar(user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get booking history' })
  getBookingHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.getBookingHistory(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  createBooking(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(user, dto);
  }

  @Post(':bookingId/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancelBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(user, bookingId, dto.reason);
  }

  @Post(':bookingId/reschedule')
  @ApiOperation({ summary: 'Request a reschedule' })
  rescheduleBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('bookingId') bookingId: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingService.rescheduleBooking(user, bookingId, dto);
  }
}
